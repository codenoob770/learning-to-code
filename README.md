# learning-to-code

Learning to code from scratch. No experience needed.

**On a phone? Read [PHONE.md](PHONE.md) first** - the setup is different.

## What to do

Six short lessons. Do them in order. Each one is a file you **run**, then
**change**, then run again.

To run the first lesson, type this and press enter:

```
python3 lessons/01_printing.py
```

| Lesson | What it's about |
| --- | --- |
| `lessons/01_printing.py` | Making the computer say something |
| `lessons/02_numbers.py` | Numbers and maths |
| `lessons/03_boxes.py` | Putting things in boxes with names |
| `lessons/04_asking.py` | Asking someone a question |
| `lessons/05_choices.py` | Doing one thing or another |
| `lessons/06_lists_and_loops.py` | Doing something over and over |

Each lesson ends with a **NOW YOU TRY** bit at the bottom. Do it. That part is
where the learning actually happens - reading the lesson on its own does very
little.

## Then have a go yourself

The `practice` folder has six small tasks. Open `practice/01.py`, write your
answer in it, then check it:

```
python3 check.py
```

It tells you which ones are done, and when something's wrong it shows you what
your file printed next to what it should have printed.

## When it breaks

It will break. Constantly. That happens to everyone who writes code, forever -
it is not a sign you're bad at this.

When it breaks the computer prints a wall of text. **Read the last line only.**
That's the bit that says what's actually wrong. Here's what it usually means:

| It says | It usually means |
| --- | --- |
| `SyntaxError` | A typo. A missing `:` or a missing bracket or quote mark |
| `IndentationError` | The spacing is wrong. Use 4 spaces for lines inside an `if` or a `for` |
| `NameError` | A box name is spelt wrong, or you used a box before making it |
| `TypeError` | You mixed words and numbers. You probably need `int( )` |

Stuck on one for more than a few minutes? Paste the last line to Claude and ask.
