# LESSON 5 - Choices
#
# Run it:   python3 lessons/05_choices.py


# "if" means: only do the next bit when something is true.

temperature = 30

if temperature > 25:
    print("It is hot")


# Two things to notice up there. Both catch everyone out:
#
#   1. There is a : on the end of the if line.
#   2. The line under it is pushed in by 4 spaces.
#      Those spaces are how you say "this bit belongs to the if".


# "else" means: do this instead, when it was not true.

age = 12

if age >= 18:
    print("You can come in")
else:
    print("Too young, sorry")


# Got more than two options? Put "elif" in the middle.
# The computer goes down the list and stops at the first true one.

score = 75

if score >= 90:
    print("Great")
elif score >= 60:
    print("Good")
else:
    print("Needs work")


# Ways to compare two things:
#
#    >     bigger than
#    <     smaller than
#    >=    bigger than, or the same
#    <=    smaller than, or the same
#    ==    the same as        <- TWO equals signs. One = puts things in a box.
#    !=    not the same as


# NOW YOU TRY
# Change score to 95 and run it. Then change it to 20 and run it again.
