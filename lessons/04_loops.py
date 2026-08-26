# Lesson 4 — Repeating things (loops and lists)
#
# Run this file:   python3 lessons/04_loops.py

# A LIST holds many values in order. Square brackets, commas between items.
shopping = ["eggs", "bread", "coffee"]

print(shopping)
print(len(shopping))     # 3 — how many items
print(shopping[0])       # "eggs" — counting starts at ZERO, not one
print(shopping[-1])      # "coffee" — negative counts from the end

shopping.append("milk")  # add to the end
print(shopping)

# A FOR LOOP runs the same code once for each item in a list.
# Same rules as if: colon, then indent the body.
for item in shopping:
    print(f"- {item}")

# range() gives you a sequence of numbers to loop over.
# range(5) is 0, 1, 2, 3, 4 — starts at 0, stops BEFORE 5.
for i in range(5):
    print(i)

for i in range(1, 6):        # 1 through 5
    print(f"{i} squared is {i ** 2}")

# A WHILE LOOP repeats as long as a condition stays True.
# Make sure something inside changes, or it runs forever!
countdown = 3
while countdown > 0:
    print(countdown)
    countdown = countdown - 1
print("Liftoff!")

# A very common pattern: build up a total as you loop.
prices = [4.50, 2.25, 9.99]
total = 0
for price in prices:
    total = total + price
print(f"Total: {total:.2f}")     # :.2f means "show 2 decimal places"

# --- Try it yourself -------------------------------------------------------
# 1. Loop over `shopping` and print each item in CAPITALS. (Hint: item.upper())
# 2. Use a loop to add up the numbers 1 to 100. (The answer is 5050.)
