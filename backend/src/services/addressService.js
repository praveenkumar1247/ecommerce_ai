const prisma = require('../config/prisma');

class AddressService {
  async getUserAddresses(userId) {
    return prisma.address.findMany({
      where: { userId: parseInt(userId, 10) },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getAddressById(userId, addressId) {
    const address = await prisma.address.findFirst({
      where: {
        id: parseInt(addressId, 10),
        userId: parseInt(userId, 10),
      },
    });

    if (!address) {
      const error = new Error('Address not found.');
      error.statusCode = 404;
      throw error;
    }

    return address;
  }

  async addAddress(userId, data) {

    const {fullName,phone,addressLine1,addressLine2,city,state,postalCode,addressType,isDefault} = data;
    

    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      const error = new Error('Missing required address fields.');
      error.statusCode = 400;
      throw error;
    }

    const uId = parseInt(userId, 10);
    const existingCount = await prisma.address.count({ where: { userId: uId } });
    const shouldBeDefault = existingCount === 0 || isDefault === true || isDefault === 'true';

    if (shouldBeDefault) {
      await prisma.address.updateMany({
        where: { userId: uId },
        data: { isDefault: false },
      });
    }

    return prisma.address.create({
      data: {
        userId: uId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2 ? addressLine2.trim() : null,
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        postalCode: postalCode.trim(),
        addressType: ['HOME', 'WORK', 'OTHER'].includes(addressType) ? addressType : 'HOME',
        isDefault: shouldBeDefault,
      },
    });
  }

  async updateAddress(userId, addressId, data) {
    const uId = parseInt(userId, 10);
    const aId = parseInt(addressId, 10);

    const address = await prisma.address.findFirst({
      where: { id: aId, userId: uId },
    });

    if (!address) {
      const error = new Error('Address not found.');
      error.statusCode = 404;
      throw error;
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: uId, id: { not: aId } },
        data: { isDefault: false },
      });
    }

    const updatePayload = {};
    const fields = [
      'fullName',
      'phone',
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      'country',
      'postalCode',
      'addressType',
      'isDefault',
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined) {
        updatePayload[field] = data[field];
      }
    });

    return prisma.address.update({
      where: { id: aId },
      data: updatePayload,
    });
  }

  async deleteAddress(userId, addressId) {
    const uId = parseInt(userId, 10);
    const aId = parseInt(addressId, 10);

    const address = await prisma.address.findFirst({
      where: { id: aId, userId: uId },
    });

    if (!address) {
      const error = new Error('Address not found.');
      error.statusCode = 404;
      throw error;
    }

    await prisma.address.delete({ where: { id: aId } });

    // If deleted address was default, promote another address to default
    if (address.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: { userId: uId },
        orderBy: { createdAt: 'desc' },
      });

      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { message: 'Address deleted successfully.' };
  }

  async setDefaultAddress(userId, addressId) {
    const uId = parseInt(userId, 10);
    const aId = parseInt(addressId, 10);

    await prisma.address.updateMany({
      where: { userId: uId },
      data: { isDefault: false },
    });

    return prisma.address.update({
      where: { id: aId },
      data: { isDefault: true },
    });
  }
}

module.exports = new AddressService();
