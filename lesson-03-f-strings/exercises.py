"""Lesson 3 exercises — f-strings.

Fill in each function where it says YOUR CODE HERE, then run:

    python3 exercises.py

It grades itself and prints PASS or FAIL for each case. Aim for all green.

Two notes:
  - These are written as `def name(...)` functions. Ignore the syntax for now:
    the values in the parentheses arrive as variables you can use, and
    `return` hands a value back. Functions are a later lesson.
  - `return` an f-string; don't `print()` it. The checker looks at what you
    return. Spaces count, so read the expected output carefully.
"""


def greet(name):
    """Return a greeting.

    greet("Sam")  ->  "Hello, Sam!"
    greet("Ada")  ->  "Hello, Ada!"
    """
    # YOUR CODE HERE
    return ""


def introduce(name, age):
    """Return an introduction using both values.

    introduce("Sam", 12)  ->  "Sam is 12 years old"

    This is the one that would crash with `+`. It won't with an f-string.
    """
    # YOUR CODE HERE
    return ""


def line_total(price, quantity):
    """Return a receipt line, with the total calculated inside the braces.

    line_total(4, 3)   ->  "3 x $4 = $12"
    line_total(10, 2)  ->  "2 x $10 = $20"
    """
    # YOUR CODE HERE
    return ""


def price_tag(amount):
    """Return the amount as money, always two decimal places.

    price_tag(12.5)      ->  "$12.50"
    price_tag(3)         ->  "$3.00"
    price_tag(0.999)     ->  "$1.00"

    Hint: the :.2f format spec. It rounds for you.
    """
    # YOUR CODE HERE
    return ""


def big_number(n):
    """Return the number with comma separators.

    big_number(1234567)  ->  "1,234,567"
    big_number(999)      ->  "999"

    Hint: the `,` format spec.
    """
    # YOUR CODE HERE
    return ""


def table_row(label, count):
    """Return a row with `label` padded to 10 characters, then `count` padded
    to 6, right-aligned.

    table_row("apple", 3)   ->  "apple          3"
    table_row("banana", 12) ->  "banana        12"

    Hint: two format specs, :<10 and :>6. Count the spaces in the expected
    output if you get stuck — the answer is in there.
    """
    # YOUR CODE HERE
    return ""


def shout_name(name):
    """Return the name in capitals, inside an f-string.

    shout_name("sam")  ->  "SAM is here!"

    Hint: you can call .upper() right inside the braces.
    """
    # YOUR CODE HERE
    return ""


def show_value(score):
    """Return the debugging form: the name `score`, an equals sign, the value.

    show_value(42)  ->  "score=42"

    Hint: this is the f"{x=}" trick. One set of braces does the whole thing.
    """
    # YOUR CODE HERE
    return ""


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


CASES = [
    ("greet('Sam')", lambda m: m.greet("Sam"), "Hello, Sam!"),
    ("greet('Ada')", lambda m: m.greet("Ada"), "Hello, Ada!"),
    ("introduce('Sam', 12)", lambda m: m.introduce("Sam", 12), "Sam is 12 years old"),
    ("introduce('Ada', 36)", lambda m: m.introduce("Ada", 36), "Ada is 36 years old"),
    ("line_total(4, 3)", lambda m: m.line_total(4, 3), "3 x $4 = $12"),
    ("line_total(10, 2)", lambda m: m.line_total(10, 2), "2 x $10 = $20"),
    ("price_tag(12.5)", lambda m: m.price_tag(12.5), "$12.50"),
    ("price_tag(3)", lambda m: m.price_tag(3), "$3.00"),
    ("price_tag(0.999)", lambda m: m.price_tag(0.999), "$1.00"),
    ("big_number(1234567)", lambda m: m.big_number(1234567), "1,234,567"),
    ("big_number(999)", lambda m: m.big_number(999), "999"),
    ("table_row('apple', 3)", lambda m: m.table_row("apple", 3), "apple          3"),
    ("table_row('banana', 12)", lambda m: m.table_row("banana", 12), "banana        12"),
    ("shout_name('sam')", lambda m: m.shout_name("sam"), "SAM is here!"),
    ("show_value(42)", lambda m: m.show_value(42), "score=42"),
]


def run(module):
    results = [_check(label, call(module), expected) for label, call, expected in CASES]
    passed = sum(1 for r in results if r)
    print()
    print(f"{passed} of {len(results)} checks passing.")
    if passed == len(results):
        print("All green. Nice work — you've got f-strings.")


if __name__ == "__main__":
    import sys
    run(sys.modules[__name__])
