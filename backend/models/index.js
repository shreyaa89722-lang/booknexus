const User = require("./user");
const CollegeStudent = require("./collegeStudent");
const Book = require("./book");
const Rental = require("./rental");
const Transaction = require("./transaction");
const Review = require("./review");
const Notification = require("./notification");
const EmailOutbox = require("./emailOutbox");
const ChatLog = require("./chatlog");

module.exports = {
    User,
    user: User,
    CollegeStudent,
    collegeStudent: CollegeStudent,
    Book,
    book: Book,
    Rental,
    rental: Rental,
    Transaction,
    transaction: Transaction,
    Review,
    review: Review,
    Notification,
    notification: Notification,
    EmailOutbox,
    emailOutbox: EmailOutbox,
    ChatLog,
    chatlog: ChatLog,
};
