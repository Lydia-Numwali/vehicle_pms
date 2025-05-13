const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASS,
  },
});

const sendApprovalEmail = async (to, slotNumber, vehicle) => {
  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to,
    subject: 'Parking Slot Approval',
    text: `Your parking slot request for vehicle ${vehicle.plate_number} has been approved. Assigned slot: ${slotNumber}.`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendApprovalEmail };