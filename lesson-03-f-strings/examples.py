"""Lesson 3 — runnable examples: f-strings.

Run me:  python3 examples.py

Then change things and run me again. Try deleting an `f` on purpose.
"""

name = "Sam"
age = 12

print("=== 1. The old awkward ways ===")
print("Hello,", name, "you are", age, "years old")   # commas: forced spaces
print("Hello, " + name + "!")                        # + : type every space

print()
print("=== 2. The + failure with numbers ===")
try:
    print("You are " + age + " years old")
except TypeError as err:
    print("TypeError:", err)
    print("(This is the error f-strings save you from.)")

print()
print("=== 3. The f-string ===")
print(f"Hello, {name}, you are {age} years old")

# An f-string is just a string, so it can live in a variable.
greeting = f"Hello, {name}!"
print(greeting)

print()
print("=== 4. Expressions inside the braces ===")
price = 4
quantity = 3
print(f"Total: {price * quantity}")
print(f"Half: {price / 2}")
print(f"Shouting: {name.upper()}")
print(f"Name length: {len(name)}")
print(f"Old enough? {age >= 13}")

print()
print("=== 5. Formatting numbers ===")
total = price * quantity * 1.08
print(f"Raw:       {total}")
print(f"2 places:  ${total:.2f}")
print(f"0 places:  {3.7:.0f}")
print(f"Thousands: {1234567:,}")
print(f"Both:      {1234.5:,.2f}")

print()
print("=== 6. Alignment lines columns up ===")
fruits = ["apple", "fig", "banana"]
counts = [3, 12, 7]
print(f"{'FRUIT':<10}{'COUNT':>6}")
print(f"{fruits[0]:<10}{counts[0]:>6}")
print(f"{fruits[1]:<10}{counts[1]:>6}")
print(f"{fruits[2]:<10}{counts[2]:>6}")

print()
print("=== 7. The three classic mistakes ===")
print("Hello, {name}")                       # forgot the f — prints the braces
print(f"He said 'hi' to {name}")             # inner quotes must differ
print(f"Use {{braces}} like this, {name}")   # double up for a literal brace

print()
print("=== 8. The = debugging trick ===")
score = 42
print(f"{score=}")
print(f"{price * quantity=}")
