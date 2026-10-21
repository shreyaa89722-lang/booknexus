const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BookRental Smart Contract", function () {
  let bookRental;
  let owner, renter, otherUser;

  beforeEach(async function () {
    [owner, renter, otherUser] = await ethers.getSigners();
    const BookRentalFactory = await ethers.getContractFactory("BookRental");
    bookRental = await BookRentalFactory.deploy();
    await bookRental.waitForDeployment();
  });

  describe("createRental", function () {
    it("should create a rental transaction and emit RentalCreated event", async function () {
      const bookId = "book-mongodb-12345";
      const dueDate = Math.floor(Date.now() / 1000) + 14 * 86400;

      const tx = await bookRental.createRental(bookId, renter.address, dueDate);
      const receipt = await tx.wait();

      expect(receipt.status).to.equal(1);
      expect(await bookRental.rentalCount()).to.equal(1n);

      await expect(tx)
        .to.emit(bookRental, "RentalCreated")
        .withArgs(1n, bookId, renter.address, dueDate);

      const rental = await bookRental.getRental(1n);
      expect(rental[0]).to.equal(bookId);
      expect(rental[1]).to.equal(renter.address);
      expect(rental[2]).to.equal(BigInt(dueDate));
      expect(rental[3]).to.be.false;
    });

    it("should increment rentalCount for consecutive transactions", async function () {
      const dueDate = Math.floor(Date.now() / 1000) + 14 * 86400;
      await bookRental.createRental("book-1", renter.address, dueDate);
      await bookRental.createRental("book-2", otherUser.address, dueDate);

      expect(await bookRental.rentalCount()).to.equal(2n);
    });
  });

  describe("markReturned", function () {
    let dueDate;

    beforeEach(async function () {
      dueDate = Math.floor(Date.now() / 1000) + 14 * 86400;
      await bookRental.createRental("book-test", renter.address, dueDate);
    });

    it("should mark rental as returned and emit RentalReturned event", async function () {
      const tx = await bookRental.markReturned(1n);
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      await expect(tx)
        .to.emit(bookRental, "RentalReturned")
        .withArgs(1n);

      const rental = await bookRental.getRental(1n);
      expect(rental[3]).to.be.true; // returned is true
    });

    it("should revert if rental does not exist", async function () {
      await expect(bookRental.markReturned(999n)).to.be.revertedWith("Rental does not exist");
    });

    it("should revert if rental was already returned", async function () {
      await bookRental.markReturned(1n);
      await expect(bookRental.markReturned(1n)).to.be.revertedWith("Already returned");
    });
  });
});
