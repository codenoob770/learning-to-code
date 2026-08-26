"""Lesson 4 — runnable examples.

Run me:  python3 examples.py

Then change things and run me again. That's the point.
"""

print("=== 1. for over a list ===")
for fruit in ["apple", "banana", "cherry"]:
    print(fruit)

print()
print("=== 2. for with range ===")
for i in range(5):
    print(i)

print()
print("=== 3. range with start, stop, step ===")
print("range(1, 6):")
for i in range(1, 6):
    print(i)
print("range(0, 10, 2):")
for i in range(0, 10, 2):
    print(i)

print()
print("=== 4. while loop ===")
count = 3
while count > 0:
    print(count)
    count = count - 1
print("Liftoff!")

print()
print("=== 5. accumulator: summing ===")
prices = [4, 10, 7, 2]
total = 0
for price in prices:
    total += price
    print("  after adding", price, "total is", total)
print("final total:", total)

print()
print("=== 6. accumulator: counting, with a nested if ===")
words = ["hi", "there", "you"]
long_words = 0
for word in words:
    if len(word) > 2:
        long_words += 1
print("words longer than 2 chars:", long_words)

print()
print("=== 7. break ===")
for n in [3, 8, 2, 9, 4]:
    print("  looking at", n)
    if n > 5:
        print("Found one:", n)
        break

print()
print("=== 8. continue ===")
for n in range(1, 7):
    if n % 2 == 0:
        continue
    print(n)
