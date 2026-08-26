"""Lesson 3 solutions — f-strings, with commentary.

Read these *after* you've genuinely attempted `exercises.py`.

Run me:  python3 solutions.py
"""

import sys

from exercises import run


def greet(name):
    # The `f` touches the quote. Everything outside the braces — including the
    # comma, the space, and the "!" — is printed exactly as typed.
    return f"Hello, {name}!"


def introduce(name, age):
    # `age` is a number, and that's fine: an f-string converts it to text for
    # you. The `+` version of this line would raise TypeError.
    return f"{name} is {age} years old"


def line_total(price, quantity):
    # The braces hold a calculation, not just a variable. Note the two `$`
    # signs are plain text sitting outside the braces.
    return f"{quantity} x ${price} = ${price * quantity}"


def price_tag(amount):
    # .2f = decimal number, 2 places. It rounds for display only — `amount`
    # itself is unchanged. This is how you print money, always.
    return f"${amount:.2f}"


def big_number(n):
    # A bare `,` inserts thousands separators. Numbers under 1000 are
    # unaffected, so you don't need to special-case them.
    return f"{n:,}"


def table_row(label, count):
    # :<10 pads on the right to width 10 (text reads better left-aligned).
    # :>6 pads on the left to width 6 (numbers line up on their last digit).
    # Two of these side by side is a table.
    return f"{label:<10}{count:>6}"


def shout_name(name):
    # Method calls work inside braces. Keep them short like this one — if it
    # needs thinking about, do it on its own line first.
    return f"{name.upper()} is here!"


def show_value(score):
    # The `=` prints the expression *and* its value. It uses the name as you
    # typed it, which is why this returns "score=42" — the parameter here
    # happens to be called `score`.
    return f"{score=}"


if __name__ == "__main__":
    run(sys.modules[__name__])
