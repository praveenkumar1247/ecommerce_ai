const addressService = require('../services/addressService');
const { successResponse } = require('../utils/response');

class AddressController {
  
  async getAddresses(req, res, next) {
    try {
      const addresses = await addressService.getUserAddresses(req.user.id);
      return successResponse(res, addresses, 'Addresses retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  async addAddress(req, res, next) {
    try {
      const address = await addressService.addAddress(req.user.id, req.body);
      return successResponse(res, address, 'Address added successfully.', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req, res, next) {
    try {
      const address = await addressService.updateAddress(req.user.id, req.params.id, req.body);
      return successResponse(res, address, 'Address updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req, res, next) {
    try {
      const result = await addressService.deleteAddress(req.user.id, req.params.id);
      return successResponse(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async setDefaultAddress(req, res, next) {
    try {
      const address = await addressService.setDefaultAddress(req.user.id, req.params.id);
      return successResponse(res, address, 'Default address updated.');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AddressController();
