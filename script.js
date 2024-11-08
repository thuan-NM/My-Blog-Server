// scripts/updateCoordinates.js

const mongoose = require('mongoose');
const axios = require('axios');
const NodeCache = require('node-cache');
const addressit = require('addressit');
require('dotenv').config();

const Post = require('../My-Blog-Server/src/models/Post');

// Initialize cache with a TTL of 1 day
const geocodeCache = new NodeCache({ stdTTL: 86400 }); // 1 day in seconds

const preprocessLocation = (location) => {
    // Split the address using common delimiters
    const addressParts = location.split(/,|\n|;/).map(part => part.trim());

    // Prioritize components (you can adjust this logic)
    const components = [];
    if (addressParts.length > 0) components.push(addressParts[addressParts.length - 1]); // Country
    if (addressParts.length > 1) components.unshift(addressParts[addressParts.length - 2]); // State/Province
    if (addressParts.length > 2) components.unshift(addressParts[addressParts.length - 3]); // City

    const reconstructedAddress = components.join(', ');

    // Ensure the reconstructed address is within 256 characters
    return reconstructedAddress.substring(0, 256);
};

// Function to get coordinates from an address using Mapbox API
const getCoordinates = async (address) => {
    if (!address) {
        console.error('No address provided for geocoding.');
        return null;
    }

    // Preprocess the address to ensure it's within the character limit
    const preprocessedAddress = preprocessLocation(address);
    console.log(preprocessedAddress);

    if (!preprocessedAddress) {
        console.error(`Preprocessing failed for address: ${address}`);
        return null;
    }

    // Check cache first
    const cachedData = geocodeCache.get(preprocessedAddress);
    if (cachedData) {
        return cachedData;
    }

    const apiKey = process.env.GEOCODING_API_KEY; // Ensure your API key is stored in the environment variables
    const encodedAddress = encodeURIComponent(preprocessedAddress);
    const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodedAddress}&access_token=${apiKey}`;
    

    try {
        const response = await axios.get(url);
        if (response.data.features && response.data.features.length > 0) {
            const [longitude, latitude] = response.data.features[0].geometry.coordinates;
            const locationData = {
                coordinates: [longitude, latitude], // [longitude, latitude]
                address: response.data.features[0].place_name,
            };
            // Cache the result
            geocodeCache.set(preprocessedAddress, locationData);
            return locationData;
        } else {
            console.error(`Address not found for: ${preprocessedAddress}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching coordinates for address: ${preprocessedAddress}`, error.message);
        return null;
    }
};

const updatePosts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Primary loop: Process posts with string 'location' fields
        const postsWithoutCoordinates = await Post.find({
            $and: [
                { 'location.coordinates': { $exists: false } },
                { 'location': { $type: 'string' } }
            ]
        });

        console.log(`Found ${postsWithoutCoordinates.length} posts to update.`);

        for (const post of postsWithoutCoordinates) {
            if (!post.location) {
                console.log(`Post ID: ${post._id} has an empty location field. Skipping.`);
                continue;
            }

            const locationData = await getCoordinates(String(post.location));
            if (locationData) {
                post.location = {
                    type: 'Point',
                    coordinates: locationData.coordinates,
                    address: post.location,
                };
                await post.save();
                console.log(`Updated post ID: ${post._id}`);
            } else {
                console.log(`Skipping post ID: ${post._id} due to missing coordinates.`);
            }

            // Optional: Add a delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 200)); // 200 ms delay
        }

        // Secondary loop: Attempt to process posts with non-string 'location' fields
        const postsWithInvalidLocation = await Post.find({
            $and: [
                { 'location.coordinates': { $exists: false } },
                { 'location': { $not: { $type: 'string' } } }
            ]
        });

        console.log(`Found ${postsWithInvalidLocation.length} posts with invalid location types to attempt extraction.`);

        for (const post of postsWithInvalidLocation) {
            // Attempt to extract address string from the 'location' object if possible
            let extractedAddress = null;

            if (typeof post.location === 'object' && post.location.address) {
                extractedAddress = post.location.address;
            } else {
                console.log(`Post ID: ${post._id} has a non-string location without an 'address' field. Skipping.`);
                continue;
            }

            const locationData = await getCoordinates(extractedAddress);
            if (locationData) {
                post.location = {
                    type: 'Point',
                    coordinates: locationData.coordinates,
                    address: locationData.address || extractedAddress,
                };
                await post.save();
                console.log(`Updated post ID: ${post._id} with extracted address.`);
            } else {
                console.log(`Skipping post ID: ${post._id} due to missing coordinates from extracted address.`);
            }

            // Optional: Add a delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 200)); // 200 ms delay
        }

        console.log('All eligible posts updated.');
        mongoose.disconnect();
    } catch (error) {
        console.error('Error updating posts:', error);
    }
};

updatePosts();
