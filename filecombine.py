filenames = ['programming.txt', 'design.txt', 'students.txt']
with open('./all.txt', 'w', encoding='utf-8') as outfile:
    for fname in filenames:
        with open(fname, encoding='utf-8') as infile:
            for line in infile:
                outfile.write(line)