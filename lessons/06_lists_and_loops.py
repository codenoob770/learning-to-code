# LESSON 6 - Lists, and doing something over and over
#
# Run it:   python3 lessons/06_lists_and_loops.py


# A list holds lots of things in one box.
# Square brackets, with commas in between.

animals = ["cat", "dog", "fox"]

print(animals)
print(len(animals))       # len tells you how many are in it:  3


# To pull one thing out, say which position.
# But counting starts at 0, not 1. Everyone trips on this.
print(animals[0])         # cat
print(animals[1])         # dog


# To stick something on the end:
animals.append("owl")
print(animals)


# A "for loop" does the same thing once for every item in the list.
# Same two rules as if: a : on the end, and the next lines pushed in 4 spaces.

for animal in animals:
    print(animal)


# "animal" there is just a box name you made up.
# It holds one item at a time, then the loop goes round again with the next.

for animal in animals:
    print(f"I saw a {animal}")


# A really common job - adding things up as you go along.

prices = [4, 2, 9]
total = 0                        # start the total at nothing
for price in prices:
    total = total + price        # add each one on
print(total)                     # 15


# NOW YOU TRY
# Add your own animal to the list at the top, then run it again.
