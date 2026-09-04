const welcomeEmail = (name) => {
    return `
        <h2>Welcome to Book Nexus, ${name}!</h2>

        <p>Your account has been successfully created.</p>

        <p>You can now browse books and request rentals.</p>

        <p>Happy reading!</p>

        <p>Regards,<br>
        Book Nexus Team</p>
    `;
};

module.exports = {
    welcomeEmail
};