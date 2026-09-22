// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BookRental {
    struct Rental {
        string bookId;
        address renter;
        uint256 dueDate;
        bool returned;
    }

    mapping(uint256 => Rental) public rentals;
    uint256 public rentalCount;

    event RentalCreated(uint256 indexed rentalId, string bookId, address renter, uint256 dueDate);
    event RentalReturned(uint256 indexed rentalId);

    function createRental(string memory bookId, address renter, uint256 dueDate) public returns (uint256) {
        rentalCount++;
        rentals[rentalCount] = Rental(bookId, renter, dueDate, false);
        emit RentalCreated(rentalCount, bookId, renter, dueDate);
        return rentalCount;
    }

    function markReturned(uint256 rentalId) public {
        require(rentals[rentalId].renter != address(0), "Rental does not exist");
        require(!rentals[rentalId].returned, "Already returned");
        rentals[rentalId].returned = true;
        emit RentalReturned(rentalId);
    }

    function getRental(uint256 rentalId) public view returns (string memory, address, uint256, bool) {
        Rental memory r = rentals[rentalId];
        return (r.bookId, r.renter, r.dueDate, r.returned);
    }
}
