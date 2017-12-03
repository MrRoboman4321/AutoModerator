import os, json

with open("automod.json", encoding='UTF-8') as file:
	data = json.load(file)
	
with open("automod.txt", 'w', encoding='utf-8') as out:
	for i in data:
		out.write(i['text'] + "\n")