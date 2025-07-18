import React, { useState } from 'react';
import { Input, Badge, Button, message } from 'antd';
import { SearchOutlined, HeartOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

import WishlistSidebar from '../wishlist/wishlistSidebar';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const handleSearch = (value: string) => {
    console.log('Search:', value);
    // TODO: Implement search functionality
  };

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
    if (!isAuthenticated) {
      message.error('Please login to view your wishlist');
      return;
    }
    console.log('Opening wishlist sidebar for user:', user?.id);
    console.log('Setting isWishlistOpen to true');
    setIsWishlistOpen(true);
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
                  <Button 
                    type="primary" 
                    style={{ background: '#E6A623', border: 'none', borderRadius: '0 6px 6px 0' }}
                    onClick={() => handleSearch('')}
                  >
                    Search
                  </Button>
                }
                style={{ borderRadius: '25px' }}
                onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
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