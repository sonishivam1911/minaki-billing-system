import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, MapPin, Award, Gem, Package, IndianRupee } from 'lucide-react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Link as MuiLink,
  Grid,
} from '@mui/material';
import { formatRupees } from '../utils';
import {
  getDiamondFourCs,
  getGoldFinish,
  getGoldWeight,
  getCertificateNumber,
  getProductLocation,
} from '../utils/productUtils';

/**
 * ProductCardDetailed Component
 * Displays comprehensive product information including 4C's, location, certificate, gold details, and price breakdown
 * 
 * @param {Object} props
 * @param {Object} props.product - Product data
 * @param {Object} props.location - Location data for the product (optional)
 * @param {Function} props.onAddToCart - Callback when add to cart is clicked
 */
export const ProductCardDetailed = ({ product, location = null, onAddToCart }) => {
  const {
    id,
    item_id,
    name,
    category,
    price,
    rate,
    stock,
    stock_on_hand,
    image = '💎',
    brand,
    isDemistified = false,
    sku,
    diamond_components = [],
    metal_components = [],
    pricing_breakdown = {},
  } = product;

  // Extract product information using utility functions
  const diamondFourCs = getDiamondFourCs(product);
  const goldFinish = getGoldFinish(product);
  const goldWeight = getGoldWeight(product);
  const certificateNo = getCertificateNumber(product);
  const locationString = location ? getProductLocation(location) : 'Not Located';

  // Use the correct price and stock fields based on product type
  const finalPrice = isDemistified ? (rate || price || 0) : (price || rate || 0);
  const finalStock = isDemistified ? (stock_on_hand || stock || 0) : (stock || stock_on_hand || 0);
  const productIdentifier = isDemistified ? (item_id || id || sku) : id;
  const productType = isDemistified ? 'demistified' : 'real';

  const isOutOfStock = finalStock === 0;

  // Handle image display
  const isImageUrl = typeof image === 'string' && (image.startsWith('http') || image.startsWith('https'));

  // Create product detail link
  const productDetailLink = `/product/${productType}/${encodeURIComponent(productIdentifier)}`;

  // Price breakdown for real jewelry
  const priceBreakdown = pricing_breakdown || {};
  const hasPriceBreakdown = Object.keys(priceBreakdown).length > 0;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <MuiLink component={Link} to={productDetailLink} sx={{ textDecoration: 'none' }}>
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          {isImageUrl ? (
            <CardMedia
              component="img"
              height="250"
              image={image}
              alt={name}
              sx={{
                objectFit: 'cover',
                '&:hover': {
                  opacity: 0.9,
                },
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <Box
              sx={{
                height: 250,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
                backgroundColor: '#f5f1e8',
              }}
            >
              {image}
            </Box>
          )}
        </Box>
      </MuiLink>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Product Name and Category */}
        <MuiLink component={Link} to={productDetailLink} sx={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#2c2416', '&:hover': { color: '#8b6f47' } }}>
            {name}
          </Typography>
        </MuiLink>

        {category && (
          <Typography variant="caption" sx={{ color: '#8b6f47', mb: 1.5, display: 'block' }}>
            {category}
          </Typography>
        )}

        {/* Detailed Information Grid */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {/* 4C's of Diamond */}
          {diamondFourCs && !isDemistified && (
            <>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Gem size={16} color="#3b82f6" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e40af' }}>
                    Diamond 4C's
                  </Typography>
                </Box>
              </Grid>
              {diamondFourCs.carat && (
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                    Carat
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {diamondFourCs.carat}
                  </Typography>
                </Grid>
              )}
              {diamondFourCs.cut && (
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                    Cut
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {diamondFourCs.cut}
                  </Typography>
                </Grid>
              )}
              {diamondFourCs.color && (
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                    Color
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {diamondFourCs.color}
                  </Typography>
                </Grid>
              )}
              {diamondFourCs.clarity && (
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                    Clarity
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {diamondFourCs.clarity}
                  </Typography>
                </Grid>
              )}
            </>
          )}

          {/* Certificate Number */}
          {certificateNo && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Award size={16} color="#8b6f47" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#5d4e37' }}>
                  Certificate
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {certificateNo}
              </Typography>
            </Grid>
          )}

          {/* Location */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <MapPin size={16} color="#10b981" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#059669' }}>
                Location
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 500, color: locationString === 'Not Located' ? '#ef4444' : 'inherit' }}>
              {locationString}
            </Typography>
          </Grid>

          {/* Gold Weight */}
          {goldWeight && !isDemistified && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Package size={16} color="#f59e0b" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#d97706' }}>
                  Gold Weight
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {goldWeight.netWeight && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                      Net
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {parseFloat(goldWeight.netWeight).toFixed(2)}g
                    </Typography>
                  </Box>
                )}
                {goldWeight.grossWeight && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                      Gross
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {parseFloat(goldWeight.grossWeight).toFixed(2)}g
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          )}

          {/* Gold Finish */}
          {goldFinish && !isDemistified && (
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>
                Gold Finish
              </Typography>
              <Chip
                label={goldFinish}
                size="small"
                sx={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  fontWeight: 600,
                }}
              />
            </Grid>
          )}

          {/* Price Breakdown (for real jewelry) */}
          {hasPriceBreakdown && !isDemistified && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <IndianRupee size={16} color="#8b6f47" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#5d4e37' }}>
                  Price Breakdown
                </Typography>
              </Box>
              <Box sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {priceBreakdown.metal_cost > 0 && (
                  <div>Metal: {formatRupees(priceBreakdown.metal_cost)}</div>
                )}
                {priceBreakdown.stone_cost > 0 && (
                  <div>Stone: {formatRupees(priceBreakdown.stone_cost)}</div>
                )}
                {priceBreakdown.making_charges > 0 && (
                  <div>Making: {formatRupees(priceBreakdown.making_charges)}</div>
                )}
                {priceBreakdown.gst_amount > 0 && (
                  <div>GST: {formatRupees(priceBreakdown.gst_amount)}</div>
                )}
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Stock Status */}
        <Box sx={{ mb: 1.5 }}>
          <Chip
            label={`${finalStock} in stock`}
            size="small"
            color={isOutOfStock ? 'error' : finalStock < 3 ? 'warning' : 'default'}
          />
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#8b6f47' }}>
          {formatRupees(finalPrice)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            component={Link}
            to={productDetailLink}
            size="small"
            variant="outlined"
            startIcon={<Eye size={14} />}
          >
            View
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};

