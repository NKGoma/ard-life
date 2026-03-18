import csv
import json
import logging
import os
from pathlib import Path
from urllib.parse import unquote, urlparse

from dotenv import load_dotenv
from google import genai
from google.genai import errors
from google.genai import types
from pydantic import ValidationError

from question_schema import Frage


BASE_DIR = Path(__file__).resolve().parent
PROMPT_FILE = BASE_DIR / "prompt.md"
CSV_FILE = BASE_DIR / "url_list.csv"
OUTPUT_FILE = BASE_DIR / "mc_questions.json"
ENV_FILE = BASE_DIR / ".env"
DEFAULT_MODEL = "models/gemini-3.1-pro-preview"
LOGGER = logging.getLogger(__name__)


def configure_logging() -> None:
	logging.basicConfig(
		level=logging.INFO,
		format="%(asctime)s %(levelname)s %(name)s: %(message)s",
	)


def load_settings() -> tuple[str, str]:
	load_dotenv(ENV_FILE)

	api_key = os.getenv("GEMINI_API_KEY")
	if not api_key:
		raise RuntimeError("GEMINI_API_KEY wurde nicht in der .env Datei gefunden.")

	model_name = os.getenv("GEMINI_MODEL", DEFAULT_MODEL).strip()
	if model_name.startswith("gemini-"):
		model_name = f"models/{model_name}"

	return api_key, model_name


def load_prompt() -> str:
	return PROMPT_FILE.read_text(encoding="utf-8").strip()


def load_rows() -> list[dict[str, str]]:
	with CSV_FILE.open("r", encoding="utf-8", newline="") as csv_file:
		reader = csv.DictReader(csv_file)
		return [
			{
				"category": (row.get("category") or "").strip(),
				"url": (row.get("url") or "").strip(),
			}
			for row in reader
			if any((value or "").strip() for value in row.values())
		]


def build_prompt(prompt_template: str, row: dict[str, str]) -> str:
	return (
		f"{prompt_template}\n"
		f"{row['category']}, {row['url']}\n\n"
	)


def get_url_retrieval_status(response: types.GenerateContentResponse, url: str) -> str | None:
	for candidate in response.candidates or []:
		metadata = candidate.url_context_metadata
		if not metadata or not metadata.url_metadata:
			continue

		for url_metadata in metadata.url_metadata:
			if url_metadata.retrieved_url == url:
				status = url_metadata.url_retrieval_status
				return status.value if status is not None else None

	return None


def normalize_json_text(raw_text: str) -> str:
	text = raw_text.strip()
	if text.startswith("```"):
		lines = text.splitlines()
		if lines and lines[0].startswith("```"):
			lines = lines[1:]
		if lines and lines[-1].strip() == "```":
			lines = lines[:-1]
		text = "\n".join(lines).strip()

	return text


def derive_title_from_url(url: str) -> str:
	segments = [unquote(segment) for segment in urlparse(url).path.split("/") if segment]
	preferred_segments = [
		segment for segment in segments
		if any(character.isalpha() for character in segment)
		and segment.lower() not in {"video", "wdr"}
		and not segment.startswith("Y3JpZDov")
	]

	if not preferred_segments:
		return "ARD Mediathek"

	raw_title = preferred_segments[-1].replace("-", " ").strip()
	if not raw_title:
		return "ARD Mediathek"

	return raw_title[0].upper() + raw_title[1:]


def extract_question_text(raw_question: object) -> str:
	if isinstance(raw_question, str):
		return raw_question.strip()

	if isinstance(raw_question, dict):
		for key in ("text", "question", "prompt"):
			value = raw_question.get(key)
			if isinstance(value, str) and value.strip():
				return value.strip()

	return ""


def extract_options(raw_options: object) -> tuple[list[str], int | None]:
	if not isinstance(raw_options, list):
		return [], None

	options: list[str] = []
	correct_index: int | None = None

	for index, raw_option in enumerate(raw_options):
		if isinstance(raw_option, str):
			options.append(raw_option.strip())
			continue

		if isinstance(raw_option, dict):
			text_value = raw_option.get("text") or raw_option.get("label") or raw_option.get("option")
			if isinstance(text_value, str):
				options.append(text_value.strip())
				if correct_index is None and raw_option.get("isCorrect") is True:
					correct_index = index
				continue

		options.append(str(raw_option).strip())

	return options, correct_index


def normalize_points(raw_points: object) -> dict[str, int]:
	if not isinstance(raw_points, dict):
		return {"bildung": 0, "gemeinschaft": 0, "lebensglueck": 0}

	return {
		"bildung": int(raw_points.get("bildung", 0) or 0),
		"gemeinschaft": int(raw_points.get("gemeinschaft", 0) or 0),
		"lebensglueck": int(raw_points.get("lebensglueck", 0) or 0),
	}


def normalize_question_payload(candidate_text: str, row: dict[str, str], question_id: str) -> Frage:
	try:
		payload = json.loads(candidate_text)
	except json.JSONDecodeError as exc:
		raise RuntimeError(f"Antwort fuer {row['url']} ist kein gueltiges JSON: {exc}") from exc

	if not isinstance(payload, dict):
		raise RuntimeError(f"Antwort fuer {row['url']} muss ein JSON-Objekt sein.")

	question_text = extract_question_text(payload.get("question"))
	options, derived_correct_index = extract_options(payload.get("options"))
	correct_index = payload.get("correctIndex")
	if not isinstance(correct_index, int):
		correct_index = derived_correct_index

	normalized_payload = {
		"id": payload.get("id") or question_id,
		"category": payload.get("category") or row["category"],
		"title": payload.get("title") or payload.get("sourceTitle") or derive_title_from_url(row["url"]),
		"url": payload.get("url") or row["url"],
		"question": question_text,
		"options": options,
		"correctIndex": correct_index,
		"points": normalize_points(payload.get("points")),
		"insight": payload.get("insight") or payload.get("explanation") or "Die Frage fasst einen zentralen Inhalt der Quelle zusammen.",
	}

	try:
		return Frage.model_validate(normalized_payload)
	except ValidationError as exc:
		raise RuntimeError(f"Ungueltiges JSON fuer {row['url']}: {exc}") from exc


def request_generation(
	client: genai.Client,
	model_name: str,
	contents: str,
	tools: list[types.Tool],
) -> types.GenerateContentResponse:
	try:
		return client.models.generate_content(
			model=model_name,
			contents=contents,
			config=types.GenerateContentConfig(
				tools=tools,
				temperature=0.4,
			),
		)
	except errors.ClientError as exc:
		if exc.code == 404:
			raise RuntimeError(
				f"Das Modell '{model_name}' ist fuer generateContent nicht verfuegbar. "
				"Setze GEMINI_MODEL in der .env Datei auf ein unterstuetztes Modell, zum Beispiel models/gemini-3.1-pro-preview."
			) from exc
		raise


def build_search_fallback_prompt(prompt_template: str, row: dict[str, str], retrieval_status: str | None) -> str:
	return (
		f"{prompt_template}\n"
		f"{row['category']}, {row['url']}\n\n"
		"Die angegebene URL konnte nicht direkt gelesen werden. "
		f"Status: {retrieval_status or 'unbekannt'}. "
		"Fuehre deshalb eine Websuche anhand dieser exakten URL und des dazugehoerigen Seitenthemas durch. "
		"Nutze Suchtreffer, Snippets und verfuegbare Metadaten zu dieser URL als Grundlage fuer die Frage."
	)


def generate_question(
	client: genai.Client,
	model_name: str,
	prompt_template: str,
	row: dict[str, str],
	question_id: str,
) -> Frage:
	LOGGER.info("Generiere Frage %s fuer %s", question_id, row["url"])
	response = request_generation(
		client=client,
		model_name=model_name,
		contents=build_prompt(prompt_template, row),
		tools=[types.Tool(url_context=types.UrlContext())],
	)

	url_retrieval_status = get_url_retrieval_status(response, row["url"])
	if url_retrieval_status and url_retrieval_status != "URL_RETRIEVAL_STATUS_SUCCESS":
		LOGGER.warning(
			"Direkter URL-Abruf fuer %s fehlgeschlagen (%s), wechsle auf Websuche.",
			row["url"],
			url_retrieval_status,
		)
		response = request_generation(
			client=client,
			model_name=model_name,
			contents=build_search_fallback_prompt(prompt_template, row, url_retrieval_status),
			tools=[types.Tool(google_search=types.GoogleSearch())],
		)

	candidate_text = normalize_json_text(response.text or "")
	if not candidate_text:
		raise RuntimeError(f"Gemini hat fuer {row['url']} keine Antwort geliefert.")

	return normalize_question_payload(candidate_text, row, question_id)


def write_output(questions: list[Frage]) -> None:
	payload = [question.model_dump(mode="json") for question in questions]
	OUTPUT_FILE.write_text(
		json.dumps(payload, ensure_ascii=False, indent=2),
		encoding="utf-8",
	)


def main() -> None:
	configure_logging()
	api_key, model_name = load_settings()
	prompt_template = load_prompt()
	rows = load_rows()

	if not rows:
		raise RuntimeError("Die Datei url_list.csv enthaelt keine gueltigen Datenzeilen.")

	client = genai.Client(api_key=api_key)
	questions: list[Frage] = []

	for index, row in enumerate(rows, start=1):
		question_id = f"q{index:03d}"
		question = generate_question(client, model_name, prompt_template, row, question_id)
		questions.append(question)
		write_output(questions)
		LOGGER.info(
			"Frage %s wurde gespeichert (%s/%s).",
			question_id,
			len(questions),
			len(rows),
		)

	LOGGER.info("%s Fragen wurden in %s gespeichert.", len(questions), OUTPUT_FILE.name)


if __name__ == "__main__":
	main()
