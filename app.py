from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import Base, engine, SessionLocal, User, Book, Bookshelf
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import os

app = Flask(__name__, static_folder="static")
# Use SECRET_KEY from environment (set in Codespaces or Replit). Fallback for quick testing only.
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-this")

# Ensure DB tables exist
Base.metadata.create_all(bind=engine)

def get_db():
    """Yield a SQLAlchemy session; use next(get_db()) to get a session instance."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def current_user():
    """Return the logged-in User object or None."""
    user_id = session.get("user_id")
    if not user_id:
        return None
    db = next(get_db())
    return db.query(User).filter(User.id == user_id).first()

@app.route("/")
def index():
    db = next(get_db())
    # Fetch all books with their owners
    books = db.query(Book).order_by(Book.created_at.desc()).all()
    books_with_owners = []
    unique_owners_dict = {}
    for b in books:
        owners = [ {"id": s.user.id, "name": s.user.name or s.user.email} for s in b.shelves ]
        books_with_owners.append({
            "id": b.id,
            "openlibrary_id": b.openlibrary_id,
            "title": b.title,
            "author": b.author,
            "genre": b.genre,
            "pages": b.pages,
            "cover_url": b.cover_url,
            "owners": owners
        })
        # Collect unique owners
        for owner in owners:
            if owner["id"] not in unique_owners_dict:
                unique_owners_dict[owner["id"]] = owner
    
    unique_owners = list(unique_owners_dict.values())
    return render_template("index.html", books=books_with_owners, unique_owners=unique_owners, user=current_user())

@app.route("/add")
def add_page():
    if not current_user():
        return redirect(url_for("login", next=url_for("add_page")))
    return render_template("add.html", user=current_user())

@app.route("/my-books")
def my_books():
    user = current_user()
    if not user:
        return redirect(url_for("login", next=url_for("my_books")))
    db = next(get_db())
    shelves = db.query(Bookshelf).filter(Bookshelf.user_id == user.id).all()
    books = []
    for s in shelves:
        b = s.book
        books.append({
            "bookshelf_id": s.id,
            "book_id": b.id,
            "openlibrary_id": b.openlibrary_id,
            "title": b.title,
            "author": b.author,
            "genre": b.genre,
            "pages": b.pages,
            "cover_url": b.cover_url,
            "added_at": s.added_at
        })
    return render_template("mybooks.html", books=books, user=user)

# API endpoint to add a book for current user
@app.route("/api/books/add", methods=["POST"])
def api_add_book():
    user = current_user()
    if not user:
        return jsonify({"error": "not authenticated"}), 401

    data = request.get_json() or {}
    openlibrary_id = data.get("openLibraryId") or data.get("openlibrary_id")
    title = data.get("title")
    author = data.get("author")
    genre = data.get("genre")
    cover_url = data.get("coverUrl") or data.get("cover_url")
    
    # Convert pages to integer
    try:
        pages = int(data.get("pages")) if data.get("pages") else None
    except (ValueError, TypeError):
        pages = None

    if not openlibrary_id or not title:
        return jsonify({"error": "openLibraryId and title required"}), 400

    db = next(get_db())

    # Upsert book by openlibrary_id
    book = db.query(Book).filter(Book.openlibrary_id == openlibrary_id).first()
    if not book:
        book = Book(
            openlibrary_id=openlibrary_id,
            title=title,
            author=author,
            genre=genre,
            pages=pages,
            cover_url=cover_url,
            created_at=datetime.utcnow()
        )
        db.add(book)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            book = db.query(Book).filter(Book.openlibrary_id == openlibrary_id).first()

    # Create bookshelf entry if missing
    existing = db.query(Bookshelf).filter(Bookshelf.user_id == user.id, Bookshelf.book_id == book.id).first()
    if not existing:
        bs = Bookshelf(user_id=user.id, book_id=book.id, added_at=datetime.utcnow())
        db.add(bs)
        db.commit()

    return jsonify({"success": True, "book": {"id": book.id, "title": book.title}})

# Remove a book from the current user's bookshelf
@app.route("/api/books/remove", methods=["POST"])
def api_remove_book():
    user = current_user()
    if not user:
        return jsonify({"error": "not authenticated"}), 401

    data = request.get_json() or {}
    book_id = data.get("book_id")
    openlibrary_id = data.get("openlibrary_id")

    db = next(get_db())

    if book_id is None and not openlibrary_id:
        return jsonify({"error": "book_id or openlibrary_id required"}), 400

    if openlibrary_id and not book_id:
        book = db.query(Book).filter(Book.openlibrary_id == openlibrary_id).first()
        if not book:
            return jsonify({"error": "book not found"}), 404
        book_id = book.id

    shelf = db.query(Bookshelf).filter(Bookshelf.user_id == user.id, Bookshelf.book_id == book_id).first()
    if not shelf:
        return jsonify({"error": "entry not found"}), 404

    db.delete(shelf)
    db.commit()

    # Optional: remove orphaned Book records (uncomment if you want)
    # remaining = db.query(Bookshelf).filter(Bookshelf.book_id == book_id).first()
    # if not remaining:
    #     book = db.query(Book).filter(Book.id == book_id).first()
    #     if book:
    #         db.delete(book)
    #         db.commit()

    return jsonify({"success": True})

# API: list all books with owners
@app.route("/api/books", methods=["GET"])
def api_list_books():
    db = next(get_db())
    books = db.query(Book).order_by(Book.created_at.desc()).all()
    out = []
    for b in books:
        owners = [ {"id": s.user.id, "name": s.user.name or s.user.email} for s in b.shelves ]
        out.append({
            "id": b.id,
            "openlibrary_id": b.openlibrary_id,
            "title": b.title,
            "author": b.author,
            "genre": b.genre,
            "pages": b.pages,
            "cover_url": b.cover_url,
            "owners": owners
        })
    return jsonify(out)

# ---- Authentication routes (signup / login / logout) ----
@app.route("/auth/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        password = request.form.get("password")
        if not email or not password:
            return render_template("auth_signup.html", error="Email and password required")
        db = next(get_db())
        hashed = generate_password_hash(password)
        user = User(name=name, email=email, password_hash=hashed, created_at=datetime.utcnow())
        db.add(user)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            return render_template("auth_signup.html", error="Email already registered")
        return redirect(url_for("login"))
    return render_template("auth_signup.html")

@app.route("/auth/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        db = next(get_db())
        user = db.query(User).filter(User.email == email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return render_template("auth_login.html", error="Invalid credentials")
        session["user_id"] = user.id
        next_url = request.args.get("next") or url_for("index")
        return redirect(next_url)
    return render_template("auth_login.html")

@app.route("/auth/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)