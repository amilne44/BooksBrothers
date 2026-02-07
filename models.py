from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Text
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy import create_engine
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///books.db")

engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime)
    shelves = relationship("Bookshelf", back_populates="user", cascade="all, delete-orphan")

class Book(Base):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True, index=True)
    openlibrary_id = Column(String, unique=True, nullable=True, index=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=True)
    genre = Column(String, nullable=True)
    pages = Column(Integer, nullable=True)
    cover_url = Column(String, nullable=True)
    created_at = Column(DateTime)
    shelves = relationship("Bookshelf", back_populates="book", cascade="all, delete-orphan")

class Bookshelf(Base):
    __tablename__ = "bookshelves"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    added_at = Column(DateTime)
    user = relationship("User", back_populates="shelves")
    book = relationship("Book", back_populates="shelves")
    __table_args__ = (UniqueConstraint("user_id", "book_id", name="user_book_uc"),)