"""Lesson 3 exercises — loops.

Fill in each function where it says YOUR CODE HERE, then run:

    python3 exercises.py

It will print PASS or FAIL for each one. Aim for all green.

Don't worry that these are written as `def name(...):` — that's next lesson.
For now, just know: the values in the parentheses are handed to you as
variables, and `return` is how you hand a value back.
"""


def count_up_to(n):
    """Return a list of the numbers 1 through n (inclusive).

    count_up_to(4)  ->  [1, 2, 3, 4]
    count_up_to(1)  ->  [1]
    count_up_to(0)  ->  []

    Hint: start with an empty list, `numbers = []`, and use `numbers.append(x)`
    inside a loop to add to it. That's the accumulator pattern with a list
    instead of a number.
    """
    numbers = []
    # YOUR CODE HERE
    return numbers


def sum_of(values):
    """Return the total of all numbers in the list `values`.

    sum_of([1, 2, 3])  ->  6
    sum_of([])         ->  0

    Hint: accumulator pattern. Start at 0, add each value.
    """
    # YOUR CODE HERE
    return 0


def count_vowels(text):
    """Return how many vowels (a, e, i, o, u) are in `text`.

    count_vowels("hello")  ->  2
    count_vowels("xyz")    ->  0

    Hints:
      - You can loop over a string directly: `for letter in text:`
      - `if letter in "aeiou":` checks membership.
      - Assume lowercase input for now.
    """
    # YOUR CODE HERE
    return 0


def first_negative(values):
    """Return the first negative number in `values`, or None if there isn't one.

    first_negative([3, 1, -4, -9])  ->  -4
    first_negative([1, 2, 3])       ->  None

    Hint: this is what `break` is for — stop as soon as you find it.
    Careful: return the *first* one, not the last.
    """
    # YOUR CODE HERE
    return None


def countdown(start):
    """Return a countdown from `start` down to 1, followed by "Liftoff!".

    countdown(3)  ->  [3, 2, 1, "Liftoff!"]
    countdown(0)  ->  ["Liftoff!"]

    Hint: use a `while` loop. Make sure something inside the loop moves
    `start` toward 0, or you'll hang. (Ctrl+C rescues you if it does.)
    """
    result = []
    # YOUR CODE HERE
    return result


# ---------------------------------------------------------------------------
# Checker — you don't need to read below this line (but you can).
# ---------------------------------------------------------------------------

def _check(name, got, expected):
    if got == expected:
        print(f"PASS  {name}")
        return True
    print(f"FAIL  {name}")
    print(f"        expected: {expected!r}")
    print(f"        got:      {got!r}")
    return False


def main():
    results = [
        _check("count_up_to(4)", count_up_to(4), [1, 2, 3, 4]),
        _check("count_up_to(1)", count_up_to(1), [1]),
        _check("count_up_to(0)", count_up_to(0), []),

        _check("sum_of([1, 2, 3])", sum_of([1, 2, 3]), 6),
        _check("sum_of([])", sum_of([]), 0),
        _check("sum_of([-5, 5, 10])", sum_of([-5, 5, 10]), 10),

        _check("count_vowels('hello')", count_vowels("hello"), 2),
        _check("count_vowels('xyz')", count_vowels("xyz"), 0),
        _check("count_vowels('aeiou')", count_vowels("aeiou"), 5),

        _check("first_negative([3, 1, -4, -9])", first_negative([3, 1, -4, -9]), -4),
        _check("first_negative([1, 2, 3])", first_negative([1, 2, 3]), None),

        _check("countdown(3)", countdown(3), [3, 2, 1, "Liftoff!"]),
        _check("countdown(0)", countdown(0), ["Liftoff!"]),
    ]
    passed = sum(1 for r in results if r)
    print()
    print(f"{passed} of {len(results)} checks passing.")
    if passed == len(results):
        print("All green. Nice work — you've got loops.")


if __name__ == "__main__":
    main()
