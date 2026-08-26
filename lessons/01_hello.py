# Lesson 1 — Your first program
#
# Run this file:   python3 lessons/01_hello.py
#
# A "program" is just a list of instructions. Python runs them top to bottom,
# one line at a time. Lines starting with # are COMMENTS — Python ignores them.
# They're notes for humans (like this one).

# print() shows something on the screen. The stuff in quotes is a "string" —
# that just means text.
print("Hello, world!")

# You can print more than one thing. Python puts a space between them.
print("I am", "learning", "to code")

# Numbers don't need quotes. Python can do math with them.
print(2 + 2)
print(10 / 4)      # division always gives a decimal: 2.5
print(10 // 4)     # floor division throws away the remainder: 2
print(10 % 4)      # modulo gives you the remainder: 2
print(2 ** 10)     # ** is "to the power of": 1024

# Careful — quotes change the meaning completely:
print(2 + 2)       # 4      (math on numbers)
print("2 + 2")     # 2 + 2  (just text, Python doesn't look inside)

# --- Try it yourself -------------------------------------------------------
# 1. Change "Hello, world!" to your own name and run the file again.
# 2. Add a line that prints how many minutes are in a week.
#    (Hint: let Python do the multiplication for you.)
