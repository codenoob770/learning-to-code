# Lesson 3 — f-strings

**Where we are:** Lesson 1 gave you variables and `print()`. Lesson 2 gave you
`if` / `elif` / `else`. Lesson 3 is about **putting your variables inside your
text** — cleanly.

That little `f` before the quote mark is the whole lesson:

```python
name = "Sam"
print(f"Hello, {name}!")     # Hello, Sam!
```

---

## Part 1 — The problem f-strings solve

In Lesson 1 you printed variables with commas:

```python
name = "Sam"
age = 12
print("Hello,", name, "you are", age, "years old")
```

That works, but it's awkward. You can't control the spaces (Python inserts one
between every comma, whether you want it or not), and it's hard to read.

You might also have seen `+`:

```python
print("Hello, " + name + "!")
```

Worse. Every space has to be typed by hand, and the moment a number is
involved it breaks outright:

```python
print("You are " + age + " years old")
```

```
TypeError: can only concatenate str (not "int") to str
```

Python refuses to glue a number onto a string with `+`. This is a real error
you will hit, so it's worth recognizing on sight.

## Part 2 — The fix

Put an `f` immediately before the opening quote, then wrap any variable in
curly braces `{}`:

```python
name = "Sam"
age = 12
print(f"Hello, {name}, you are {age} years old")
```

```
Hello, Sam, you are 12 years old
```

`f` stands for **format**. The rules:

1. The `f` goes **outside** the quote, touching it: `f"..."`. Not `"f..."`.
2. Anything in `{}` gets replaced by that variable's value.
3. Anything outside `{}` is printed exactly as typed — including your spaces.
4. It works with `'single'` or `"double"` quotes, same as normal strings.

That third rule is the win: **you control every character**. No mystery spaces.

f-strings aren't only for printing. An f-string *is* a string, so you can store
one in a variable like any other:

```python
greeting = f"Hello, {name}!"
print(greeting)
```

## Part 3 — Braces hold expressions, not just variables

Anything Python can *calculate* can go in the braces:

```python
price = 4
quantity = 3
print(f"Total: {price * quantity}")        # Total: 12
print(f"Half: {price / 2}")                # Half: 2.0
print(f"Shouting: {name.upper()}")         # Shouting: SAM
print(f"Name length: {len(name)}")         # Name length: 3
```

Numbers stop being a problem entirely — the `TypeError` from Part 1 simply
can't happen here, because f-strings convert values to text for you.

You can even put a comparison in, which pairs nicely with Lesson 2:

```python
age = 12
print(f"Old enough? {age >= 13}")          # Old enough? False
```

Keep the expressions short, though. If the thing in the braces needs thinking
about, work it out on its own line first and put the variable in the braces.
An f-string should be easy to read at a glance:

```python
total = price * quantity * 1.08   # clearer than cramming this into the braces
print(f"With tax: {total}")
```

## Part 4 — Formatting numbers

Division and decimals give you whatever the math produces — `f"{10/3}"` prints
`3.3333333333333335`, which nobody wants to read. Money should show exactly two
decimal places. Add `:` and a format spec inside the braces:

```python
total = 12.96
print(f"Cost: ${total:.2f}")      # Cost: $12.96
```

`.2f` means "a decimal number, 2 places". It **rounds** for display; the
variable itself is untouched.

The handful worth knowing now:

| Spec | Example | Result |
|---|---|---|
| `.2f` | `f"{3.14159:.2f}"` | `3.14` |
| `.0f` | `f"{3.7:.0f}"` | `4` |
| `,` | `f"{1234567:,}"` | `1,234,567` |
| `,.2f` | `f"{1234.5:,.2f}"` | `1,234.50` |
| `>8` | `f"{'hi':>8}"` | `      hi` (right-aligned, width 8) |
| `<8` | `f"{'hi':<8}"` | `hi      ` (left-aligned) |
| `^8` | `f"{'hi':^8}"` | `   hi   ` (centered) |

The alignment ones are how you line columns up in a table — you'll want them
the moment you print a list of things. Don't memorize this table; know it
exists and come back to it.

## Part 5 — Three mistakes everyone makes

**1. Forgetting the `f`.**

```python
print("Hello, {name}")     # Hello, {name}
```

No error — it just prints the braces literally. If you see `{}` in your output,
you forgot the `f`. This is the most common f-string bug by a mile.

**2. Reusing the same quote inside.**

```python
print(f"He said "hi" to {name}")     # SyntaxError
```

The second `"` ends the string early. Use the other quote type inside:

```python
print(f"He said 'hi' to {name}")
```

**3. Wanting a literal curly brace.** Double it up:

```python
print(f"Use {{braces}} like this, {name}")   # Use {braces} like this, Sam
```

## Part 6 — A debugging trick worth knowing now

Put `=` after the variable name inside the braces:

```python
score = 42
print(f"{score=}")        # score=42
```

It prints the name *and* the value. When you're trying to work out why a
program is misbehaving, sprinkling a few of these in beats guessing — and it
saves you typing the name twice.

---

## Try it

```
cd lesson-03-f-strings
python3 examples.py
```

Read it top to bottom, then change things and re-run. Deliberately break one:
delete an `f` and see what prints.

## Your exercises

Open `exercises.py`. Each function has a docstring saying exactly what string
it should return, and a `# YOUR CODE HERE` marker. Then run:

```
python3 exercises.py
```

It grades itself and prints PASS or FAIL for each case. Keep going until every
line says `PASS`. Pay attention to the FAIL output — it shows you what it
expected next to what you produced, and with strings the difference is often
one space.

`solutions.py` has commented answers. Try first; struggling is the part that
teaches.

---

## What you should be able to do now

- [ ] Write an f-string with a variable in it
- [ ] Explain why `"age: " + age` fails but `f"age: {age}"` doesn't
- [ ] Put a calculation inside the braces
- [ ] Round a number for display with `:.2f`
- [ ] Spot a missing `f` from the output alone
- [ ] Use `f"{x=}"` to check a value while debugging

**Next lesson:** loops — doing something many times without writing it many
times.
