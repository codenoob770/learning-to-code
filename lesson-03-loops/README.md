# Lesson 3 — Loops

**Where we are:** Lesson 1 gave you variables and `print()`. Lesson 2 gave you
`if` / `elif` / `else`, so your programs could make decisions. Lesson 3 gives
you *repetition* — the thing that makes computers actually worth using.

## Why loops matter

Say you want to print the numbers 1 through 5. Without loops:

```python
print(1)
print(2)
print(3)
print(4)
print(5)
```

Now do 1 through 1000. You can't. That's the problem loops solve: **write the
instruction once, tell Python how many times to run it.**

---

## Part 1 — The `for` loop

A `for` loop walks through a collection, one item at a time.

```python
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)
```

Output:

```
apple
banana
cherry
```

Read it out loud: *"for each fruit in this list, print the fruit."* That's
literally what it does.

Three things to notice:

1. `fruit` is a variable **you name**. Python fills it in for you each time
   around. You could call it `x`, but `fruit` tells the reader what's in it.
2. The line ends with a colon `:` — same as `if` did in Lesson 2.
3. The indented block underneath is the **body**: the code that repeats.
   Indentation is how Python knows where the loop ends. This is the #1 source
   of beginner bugs, so watch it.

### Looping a specific number of times: `range()`

Most of the time you don't have a list, you just want to repeat N times.
`range(n)` gives you the numbers `0` up to *but not including* `n`:

```python
for i in range(5):
    print(i)
```

Output: `0 1 2 3 4` (on separate lines).

That "not including" trips everyone up at first. `range(5)` produces **five
numbers**, starting at zero. Five numbers, ending at four. Count them.

`range` has two other forms:

```python
range(1, 6)      # 1, 2, 3, 4, 5     -> start at 1, stop before 6
range(0, 10, 2)  # 0, 2, 4, 6, 8     -> step by 2
```

---

## Part 2 — The `while` loop

A `while` loop repeats as long as a condition is true. It's `if` that keeps
going.

```python
count = 3
while count > 0:
    print(count)
    count = count - 1
print("Liftoff!")
```

Output:

```
3
2
1
Liftoff!
```

The rule to burn into your brain: **something inside the loop must eventually
make the condition false.** Here it's `count = count - 1`. Delete that line and
`count` stays at 3 forever, the condition never turns false, and your program
hangs — an *infinite loop*. (If that happens while you're experimenting, press
`Ctrl+C` to kill it. It happens to everyone.)

### Which one do I use?

| Situation | Use |
|---|---|
| You know how many times, or you have a list | `for` |
| You repeat until something changes, and don't know how long | `while` |

When in doubt, reach for `for` first. It can't run forever, so it's harder to
get wrong.

---

## Part 3 — The accumulator pattern

This is the single most useful loop pattern there is, and you'll use it for
the rest of your programming life. It's three steps:

```python
prices = [4, 10, 7, 2]

total = 0                # 1. start a variable OUTSIDE the loop
for price in prices:
    total = total + price    # 2. update it INSIDE the loop
print(total)             # 3. use it AFTER the loop
```

`total` starts at 0, then becomes 4, then 14, then 21, then 23.

The "outside / inside / after" placement is the whole trick. Put `total = 0`
inside the loop and you reset it every pass, ending up with just the last
value. Put the `print` inside and you print four times instead of once.

Shortcut: `total = total + price` can be written `total += price`. Same thing,
less typing. `-=`, `*=` work too.

The same shape counts things:

```python
words = ["hi", "there", "you"]
long_words = 0
for word in words:
    if len(word) > 2:
        long_words += 1
print(long_words)   # 2
```

Notice the `if` **nested inside** the `for` — indented one more level. Loops
and conditionals combine freely, and that combination is where real programs
live.

---

## Part 4 — `break` and `continue`

Two words that let you steer a loop from the inside.

`break` — leave the loop immediately:

```python
for n in [3, 8, 2, 9, 4]:
    if n > 5:
        print("Found one:", n)
        break            # stops at 8; never looks at 2, 9, 4
```

`continue` — skip the rest of *this* pass, go to the next one:

```python
for n in range(1, 7):
    if n % 2 == 0:       # % is remainder; == 0 means "divides evenly"
        continue         # skip even numbers
    print(n)             # 1, 3, 5
```

Use them sparingly. A loop with four `break`s in it is usually a loop that
wants to be rewritten.

---

## Try it

Working code you can run and poke at:

```
python3 examples.py
```

Read it top to bottom, then change numbers and re-run it. Breaking things on
purpose is how you learn what the rules actually are.

## Your exercises

Open `exercises.py`. There are five, in increasing difficulty. Each one has a
docstring saying what it should do and a `# YOUR CODE HERE` marker.

Check your work by running:

```
python3 exercises.py
```

It will check your work and print PASS or FAIL for each case. Keep going until
every line says `PASS`.

Stuck? `solutions.py` has answers with commentary — but genuinely try first.
Struggling for ten minutes teaches more than reading the answer teaches in
ten seconds.

---

## What you should be able to do now

- [ ] Write a `for` loop over a list
- [ ] Use `range()` with one, two, and three arguments
- [ ] Write a `while` loop without making it infinite
- [ ] Use the accumulator pattern to sum or count
- [ ] Nest an `if` inside a `for`
- [ ] Explain the difference between `break` and `continue`

**Next lesson:** functions — packaging code up so you can name it and reuse it.
