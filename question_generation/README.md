
# Fragengenerierung mit Gemini

Dafür wird eine Prompt Schablone genommen question_generation\prompt.md
Diese wird mit den Informationen zu Kategorien / Alterklassen gefüllt. 
Außerdem wird eine URL zur ARD Mediathek übergeben. Alles in question_generation\url_list.csv
Die URL wird per Gemini URL-Context-Tool abgerufen, damit der Seiteninhalt in die Generierung einfließt.
Falls die URL nicht abrufbar ist, etwa wegen Paywall oder unsicherem Inhalt, bricht das Skript mit einer klaren Fehlermeldung ab.
Das Ausgabeformat der Frage ist JSON nach dem Schema in question_generation\question_schema.py


