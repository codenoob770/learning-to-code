# Lesson 3 — Making decisions (if / elif / else)
#
# Run this file:   python3 lessons/03_decisions.py

temperature = 30

# if runs a block of code ONLY when a condition is True.
# Notice two things: the colon at the end of the line, and the INDENTATION
# (4 spaces) on the next line. In Python, indentation is what says
# "this belongs inside the if". Get it wrong and the program breaks.
if temperature > 25:
    print("It's hot out.")
    print("Bring water.")      # also inside the if — same indentation

print("This line always runs.")  # not indented, so it's outside the if

# elif ("else if") and else let you handle other cases.
# Python checks them top to bottom and stops at the first one that's True.
score = 78

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"

print(f"Score {score} is a {grade}")

# COMPARISONS give you True or False:
#   ==   equal to          (two equals signs! one = means "store")
#   !=   not equal to
#   <  >  <=  >=           less / greater than
print(5 == 5)      # True
print(5 != 5)      # False
print("a" == "A")  # False — capitals matter

# Combine conditions with and / or / not:
age = 20
has_ticket = True

if age >= 18 and has_ticket:
    print("You may enter.")

if not has_ticket:
    print("Go buy a ticket.")

# --- Try it yourself -------------------------------------------------------
# 1. Change `score` and re-run until you've seen every grade print.
# 2. Write an if/else that prints "even" or "odd" for a number of your choice.
#    (Hint: number % 2 == 0 is True when the number is even.)
