import React, { useState, useEffect } from 'react';
import { Button, List, Spin, Empty, message } from 'antd';
import { CloseOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { wishlistAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

interface WishlistItem {
  _id: string;
  userId: string;
  productId: string;
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    images?: string[];
  };
}

interface WishlistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const WishlistSidebar: React.FC<WishlistSidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch wishlist items when sidebar opens
  useEffect(() => {
    if (isOpen && user?.id) {
      console.log('WishlistSidebar: Opening sidebar for user:', user.id);
      fetchWishlistItems();
    } else if (isOpen && !user?.id) {
      console.log('WishlistSidebar: User not authenticated');
      setError('Please login to view your wishlist');
    }
  }, [isOpen, user]);

  const fetchWishlistItems = async () => {
    if (!user?.id) {
      console.log('WishlistSidebar: No user ID available');
      setError('User not authenticated');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('WishlistSidebar: Fetching wishlist for user:', user.id);
      
      const response = await wishlistAPI.getWishlistByUser(user.id);
      console.log('WishlistSidebar: API response:', response);
      
      // Handle different possible response structures
      let wishlistData;
      if (response && typeof response === 'object') {
        if (response.data) {
          wishlistData = response.data;
        } else if (response.wishlist) {
          wishlistData = response.wishlist;
        } else if (Array.isArray(response)) {
          wishlistData = response;
        } else {
          wishlistData = [];
        }
      } else {
        wishlistData = [];
      }
      
      console.log('WishlistSidebar: Processed wishlist data:', wishlistData);
      
      if (Array.isArray(wishlistData)) {
        setWishlistItems(wishlistData);
        console.log('WishlistSidebar: Set wishlist items:', wishlistData.length);
      } else {
        console.log('WishlistSidebar: Wishlist data is not an array:', wishlistData);
        setWishlistItems([]);
      }
    } catch (error: any) {
      console.error('WishlistSidebar: Failed to fetch wishlist:', error);
      console.error('WishlistSidebar: Error details:', error.response?.data || error.message);
      setError('Failed to load wishlist');
      message.error('Failed to load wishlist');
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!user?.id) return;
    
    try {
      await wishlistAPI.removeFromWishlist(user.id, productId);
      message.success('Removed from wishlist');
      // Refresh wishlist items
      fetchWishlistItems();
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      message.error('Failed to remove from wishlist');
    }
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/product/${productId}`);
    onClose();
  };

  const getProductImage = (item: WishlistItem) => {
    // Check if product has images array
    if (item.product.images && item.product.images.length > 0) {
      const firstImage = item.product.images[0];
      if (firstImage && 
          !firstImage.includes('example.com') && 
          !firstImage.includes('placeholder') &&
          !firstImage.startsWith('blob:')) {
        return firstImage;
      }
    }
    
    // Check if product has single image
    if (item.product.image && 
        !item.product.image.includes('example.com') && 
        !item.product.image.includes('placeholder') &&
        !item.product.image.startsWith('blob:')) {
      return item.product.image;
    }
    
    // Return placeholder
    return 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=120';
  };

  const getProductPrice = (item: WishlistItem) => {
    return item.product.price || 0;
  };

  console.log('WishlistSidebar: Rendering with props:', { isOpen, user: user?.id, loading, error, wishlistItemsCount: wishlistItems.length });

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`sidebar-cart ${isOpen ? 'open' : ''}`}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Wishlist</h3>
            <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
          </div>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <Spin size="large" />
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
              <p>{error}</p>
            </div>
          ) : wishlistItems.length > 0 ? (
            <List
              dataSource={wishlistItems}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src={getProductImage(item)} 
                      alt={item.product.name}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=120';
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>{item.product.name}</div>
                      <div style={{ color: '#666', fontSize: '14px' }}>
                        ${getProductPrice(item)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => handleViewProduct(item.product._id)}
                          style={{ padding: '0', height: 'auto' }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveFromWishlist(item.product._id)}
                    />
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
              <Empty description="Your wishlist is empty" />
            </div>
          )}
          
          {wishlistItems.length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginBottom: '16px' }}>
                <span>Total Items: {wishlistItems.length}</span>
              </div>
              <Button 
                type="primary" 
                block 
                size="large"
                style={{ background: '#E6A623', border: 'none' }}
                onClick={() => {
                  // TODO: Implement view all wishlist items page
                  message.info('View all wishlist items feature coming soon!');
                }}
              >
                View All Items
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WishlistSidebar;