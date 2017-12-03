import markovify, os, sys

with open(sys.argv[2], encoding="utf-8") as f:
	text = f.read()
	
text_model = markovify.Text(text)
	
try:
	os.remove("line.txt")
except OSError:
	pass
	
with open("line.txt", "w") as line:
	line.write(text_model.make_short_sentence(int(sys.argv[1])))