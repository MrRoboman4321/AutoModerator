import os, json, sys

with open(sys.argv[1] + ".json", encoding='UTF-8') as file:
	data = json.load(file)
	
with open(sys.argv[1] + ".txt", 'w', encoding='utf-8') as out:
	for i in data:
		out.write(i['text'] + "\n")
