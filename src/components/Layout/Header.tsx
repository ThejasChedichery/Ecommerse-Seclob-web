import React, { useState, useEffect } from 'react';
import { Input, Badge, Button, message } from 'antd';
import { SearchOutlined, HeartOutlined, ShoppingCartOutlined, UserOutlined, CloseOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { useNavigate, useSearchParams } from 'react-router-dom';

import WishlistSidebar from '../wishlist/wishlistSidebar';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  const handleSearch = (value: string) => {
    console.log('Search:', value);
    if (value.trim()) {
      // Update URL with search parameter
      setSearchParams({ search: value.trim() });
    } else {
      // Remove search parameter if empty
      setSearchParams({});
    }
  };

  const handleSearchButtonClick = () => {
    handleSearch(searchValue);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchValue);
    }
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setSearchParams({});
  };

  // Sync search value with URL parameters
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchValue(urlSearch);
  }, [searchParams]);

  const handleSignIn = () => {
    if (isAuthenticated) {
      dispatch(logout());
      navigate('/auth');
    } else {
      navigate('/auth');
    }
  };

  const handleWishlistClick = () => {
    console.log('Wishlist button clicked, isAuthenticated:', isAuthenticated);
    console.log('Current user:', user);
    if (!isAuthenticated) {
      message.error('Please login to view your wishlist');
      return;
    }
    console.log('Opening wishlist sidebar for user:', user?.id);
    console.log('Setting isWishlistOpen to true');
    setIsWishlistOpen(true);
    console.log('isWishlistOpen should now be true');
  };

  const handleCartClick = () => {
    console.log('Cart clicked');
    // TODO: Implement cart functionality
  };

  const handleCloseWishlist = () => {
    console.log('Closing wishlist sidebar');
    setIsWishlistOpen(false);
  };

  console.log('Header: Current state:', { isAuthenticated, isWishlistOpen, userId: user?.id });

  return (
    <>
      <div style={{ background: '#1E5D8C', padding: '12px 0' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <Input
                placeholder="Search any things"
                prefix={<SearchOutlined />}
                suffix={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {searchValue && (
                      <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={handleClearSearch}
                        style={{ marginRight: '4px' }}
                      />
                    )}
                    <Button 
                      type="primary" 
                      style={{ background: '#E6A623', border: 'none', borderRadius: '0 6px 6px 0' }}
                      onClick={handleSearchButtonClick}
                    >
                      Search
                    </Button>
                  </div>
                }
                style={{ borderRadius: '25px' }}
                value={searchValue}
                onChange={handleSearchInputChange}
                onPressEnter={handleSearchKeyPress}
              />
            </div>
            <div className="col-md-6 text-end">
              <Button 
                type="text" 
                style={{ color: 'white', marginRight: '16px' }}
                icon={<HeartOutlined />}
                onClick={handleWishlistClick}
              >
                Wishlist
              </Button>
              <Button 
                type="text" 
                style={{ color: 'white', marginRight: '16px' }}
                icon={<UserOutlined />}
                onClick={handleSignIn}
              >
                {isAuthenticated ? `${user?.userName} (Logout)` : 'Sign In'}
              </Button>

              <Button 
                type="text" 
                style={{ color: 'white' }}
                icon={<ShoppingCartOutlined />}
                onClick={handleCartClick}
              >
                Cart
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Wishlist Sidebar */}
      <WishlistSidebar 
        isOpen={isWishlistOpen} 
        onClose={handleCloseWishlist} 
      />
    </>
  );
};

export default Header;