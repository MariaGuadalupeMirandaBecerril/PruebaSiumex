import os
import sys


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, 'backend')
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    from app import create_app  # backend/app.py

    app = create_app()
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)


if __name__ == "__main__":
    main()

