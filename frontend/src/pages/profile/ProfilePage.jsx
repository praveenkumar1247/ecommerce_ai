import React, { useState, useEffect } from 'react';
import { User, MapPin, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { addressApi } from '../../api/addressApi';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    addressType: 'HOME',
    isDefault: false,
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
    loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await addressApi.getAddresses();
      if (res.success) setAddresses(res.data);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    await updateProfile({ fullName, phone });
    setSavingProfile(false);
  };

  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      addressType: 'HOME',
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      addressType: addr.addressType,
      isDefault: addr.isDefault,
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingAddressId) {
        await addressApi.updateAddress(editingAddressId, addressForm);
        success('Address updated.');
      } else {
        await addressApi.addAddress(addressForm);
        success('Address added.');
      }
      setIsAddressModalOpen(false);
      loadAddresses();
    } catch (err) {
      toastError(err.message || 'Failed to save address.');
    }
  };

  const handleDeleteAddress = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await addressApi.deleteAddress(deleteConfirmId);
      success('Address deleted.');
      setDeleteConfirmId(null);
      loadAddresses();
    } catch (err) {
      toastError(err.message || 'Failed to delete address.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressApi.setDefaultAddress(id);
      success('Default address updated.');
      loadAddresses();
    } catch (err) {
      toastError(err.message || 'Failed to set default address.');
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px 80px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>My Account</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 36 }}>
        Manage your contact profile and saved shipping destinations
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: 36,
          alignItems: 'flex-start',
        }}
        className="profile-grid"
      >
        {/* Profile Card */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.2rem',
              }}
            >
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user?.fullName}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={savingProfile}
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Address Book */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Address Book</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Saved addresses for seamless express checkout
              </p>
            </div>

            <button type="button" className="btn btn-primary btn-sm" onClick={openAddAddressModal}>
              <Plus size={16} />
              <span>Add Address</span>
            </button>
          </div>

          {loadingAddresses ? (
            <div style={{ padding: 24, textAlign: 'center' }}>Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              No addresses saved yet. Click "Add Address" to register your delivery location.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    border: addr.isDefault ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{addr.fullName}</span>
                      <span className="badge badge-primary">{addr.addressType}</span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                      <br />
                      {addr.city}, {addr.state} - {addr.postalCode}
                      <br />
                      {addr.country}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8 }}>
                      📞 {addr.phone}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 16,
                      paddingTop: 12,
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    {addr.isDefault ? (
                      <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}>
                        ★ Default Address
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr.id)}
                        style={{ fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        Set as Default
                      </button>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => openEditAddressModal(addr)}
                        style={{ color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }}
                        title="Edit address"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(addr.id)}
                        style={{ color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
                        title="Delete address"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Address Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title={editingAddressId ? 'Edit Address' : 'Add New Address'}
      >
        <form onSubmit={handleSaveAddress}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              value={addressForm.fullName}
              onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input
              type="tel"
              required
              value={addressForm.phone}
              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address Line 1 *</label>
            <input
              type="text"
              required
              value={addressForm.addressLine1}
              onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address Line 2</label>
            <input
              type="text"
              value={addressForm.addressLine2}
              onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                required
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State *</label>
              <input
                type="text"
                required
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Postal Code *</label>
              <input
                type="text"
                required
                value={addressForm.postalCode}
                onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                value={addressForm.addressType}
                onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}
              >
                <option value="HOME">HOME</option>
                <option value="WORK">WORK</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddressModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Address
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteAddress}
        title="Delete Address?"
        message="Are you sure you want to delete this address from your account?"
        confirmText="Delete Address"
        loading={deleting}
      />

      <style>{`
        @media (max-width: 800px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
