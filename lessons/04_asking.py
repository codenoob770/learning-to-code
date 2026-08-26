# LESSON 4 - Asking a question
#
# Run it:   python3 lessons/04_asking.py


# "input" stops and waits for the person to type something.
# Whatever they type goes in the box.

name = input("What is your name? ")
print(f"Hello {name}!")


# One catch.
# Anything typed in counts as WORDS, even when it looks like a number.
# You cannot do maths with words.
# So wrap it in int( ) to turn it into a real number.

age = int(input("How old are you? "))
print(f"Next year you will be {age + 1}")


# NOW YOU TRY
# Ask for someone's favourite food, then print a sentence about it.
