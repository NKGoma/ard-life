from typing import List
from pydantic import BaseModel, Field

class Ziele(BaseModel):
    bildung: int
    gemeinschaft: int
    lebensglueck: int

class Frage(BaseModel):
  id: str = Field(..., description="Eindeutige ID der Frage, zum Beispiel q006.")
  category: str = Field(..., description="Kategorie der Frage, zum Beispiel grundwissen.")
  title: str = Field(..., description="Titel oder Quelle, auf die sich die Frage bezieht.")
  url: str = Field(..., description="Webadresse der Quelle oder des referenzierten Angebots.")
  question: str = Field(..., description="Der eigentliche Fragetext fuer die Multiple-Choice-Frage.")
  options: List[str] = Field(..., min_length=4, max_length=4, description="Liste mit genau vier moeglichen Antwortoptionen.")
  correctIndex: int = Field(..., ge=0, le=3, description="Nullbasierter Index der korrekten Antwort in options. Zulaessig sind nur Werte von 0 bis 3.")
  points: Ziele = Field(..., description="Bewertung der Frage in den Zielbereichen Bildung, Gemeinschaft und Lebensglück.")
  insight: str = Field(..., description="Kurze inhaltliche Einordnung oder Erkenntnis zur Frage.")