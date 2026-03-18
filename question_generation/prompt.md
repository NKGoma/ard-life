Für ein Spiel des Lebens das an die ARD / das öffentlich rechtliche Fernsehen angelehnt ist,
sollst du Multiple Choice Fragen erstellen.
Rufe den Inhalt der angehängten URL ab und nutze den Seiteninhalt als Grundlage der Frage.
Erstelle daraus eine Multiple Choice Frage mit 4 Antwortmöglichkeiten, von denen nur eine richtig ist.
Die Frage soll sich auf die Kategorie und die Altergruppe beziehen, die angehängt sind
Antworte ausschließlich als JSON passend zum vorgegebenen Schema.
Das JSON muss genau diese Felder enthalten: title, question, options, correctIndex, points, insight.
question muss ein String sein, kein Objekt.
options muss ein Array aus genau vier Strings sein, keine Objekte.
Erstelle genau vier Antwortmöglichkeiten.
Es darf genau eine richtige Antwort geben.
correctIndex muss zwischen 0 und 3 liegen.
points.bildung, points.gemeinschaft und points.lebensglueck sollen ganze Zahlen sein.
Beispielstruktur: {"title":"...","question":"...","options":["...","...","...","..."],"correctIndex":1,"points":{"bildung":1,"gemeinschaft":2,"lebensglueck":3},"insight":"..."}

Kategorie, Altergruppe, URL: