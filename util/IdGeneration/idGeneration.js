const { client } = require('../../database/db.js');

async function generateEntityId(entityType, prefix, collection, idField) {
  try {
    const db = client.db("RentWise");
    const entityCollection = db.collection(collection);

    // Find the entity with the highest ID number
    const lastEntity = await entityCollection
      .findOne(
        { [idField]: { $exists: true } },
        { sort: { [idField]: -1 } }
      );

    let nextNumber = 1;

    if (lastEntity && lastEntity[idField]) {
      // Extract the number from the ID (e.g., "I-0001" -> 1)
      const lastNumber = parseInt(lastEntity[idField].split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    // Format the number with leading zeros (4 digits)
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    return `${prefix}-${formattedNumber}`;
  } catch (err) {
    throw new Error(`Error generating ${entityType} ID: ${err.message}`);
  }
}

async function generateBookingID(){
  return generateEntityId("booking", "B", "Bookings", "bookingId");
}

async function generateMaintenanceID(){
  return generateEntityId("maintenance", "M", "Maintenance-Requests", "maintenanceId");
}

module.exports = {
  generateEntityId,
  generateBookingID,
  generateMaintenanceID
};
