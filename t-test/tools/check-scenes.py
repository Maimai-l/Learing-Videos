"""Find tex()/T() calls inside draw() bodies: those are not collected at build time."""
import re, sys, glob
bad = 0
for f in sorted(glob.glob(sys.argv[1] + '/*.js')):
    s = open(f, encoding='utf-8').read()
    for m in re.finditer(r'draw\(ctx, t\) \{', s):
        depth = 0; i = m.end() - 1
        while True:
            ch = s[i]
            if ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0: break
            i += 1
        body = s[m.end():i]
        for mm in re.finditer(r'(?<![\w.])(T|tex)\(', body):
            bad += 1
            print(f, 'line', s[:m.end() + mm.start()].count('\n') + 1)
print('draw-time tex calls:', bad)
