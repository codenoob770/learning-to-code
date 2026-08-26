# Lesson 2 — Variables and input
#
# Run this file:   python3 lessons/02_variables.py

# A VARIABLE is a name that points at a value. The = sign means
# "store this value under this name" — it is NOT the math "equals".
name = "Ada"
age = 36

print("Name:", name)
print("Age:", age)

# You can change what a variable points at. The old value is forgotten.
age = age + 1
print("After a birthday:", age)

# f-strings are the nicest way to build a sentence out of variables.
# Put an f before the quote, then {} around anything you want filled in.
print(f"{name} is {age} years old.")

# TYPES: every value has a type. The common ones:
print(type("hello"))   # str   — text
print(type(7))         # int   — whole number
print(type(1.5))       # float — decimal number
print(type(True))      # bool  — True or False

# Types matter. This is one of the most common beginner errors:
#   "7" + 3   ->  TypeError, because "7" is text, not a number
# Convert between them with int(), float(), and str():
text_number = "7"
real_number = int(text_number)
print(real_number + 3)     # 10

# input() asks the person running the program to type something.
# It ALWAYS gives you back text, even if they type a number — so convert it.
#
# Uncomment the three lines below and run the file to try it:
#
# their_name = input("What's your name? ")
# their_age = int(input("How old are you? "))
# print(f"Hi {their_name}! Next year you'll be {their_age + 1}.")

# --- Try it yourself -------------------------------------------------------
# 1. Make variables for a price and a quantity, then print the total.
# 2. Uncomment the input() block above and run it.
