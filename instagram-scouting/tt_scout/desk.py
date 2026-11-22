import sys
from ._fwd import load


def main():
    return load("desk").main()


if __name__ == "__main__":
    sys.exit(main())
