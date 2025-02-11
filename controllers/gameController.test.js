const request = require('supertest');
const express = require('express');
const app = express();
const { searchGames, getGameDetails } = require('./gameControllers');
const axios = require('axios');
jest.mock('axios'); // Mocking axios to avoid making actual API requests

// Example: Mocked Data for Games
const mockGames = [
    {
        id: 1,
        name: 'Game 1',
        cover: { url: 'http://image.url' },
        rating: 8.5,
        genres: { name: 'Action' },
        themes: { name: 'Fantasy' },
        platforms: { name: 'PC' },
        age_ratings: { category: 'T' },
        game_modes: { name: 'Singleplayer' },
    },
    {
        id: 2,
        name: 'Game 2',
        cover: { url: 'http://image.url' },
        rating: 9.2,
        genres: { name: 'RPG' },
        themes: { name: 'Sci-Fi' },
        platforms: { name: 'PlayStation 5' },
        age_ratings: { category: 'M' },
        game_modes: { name: 'Multiplayer' },
    },
];

// Mocking the axios response
axios.post.mockResolvedValue({ data: mockGames });

describe('Game API Tests', () => {
    // Test the search endpoint
    it('should return a list of games based on filters', async () => {
        const response = await request(app).get('/api/games/search')
            .query({ search: 'Game', genres: '4', platforms: '6', page: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2); // Based on mock data
        expect(response.body[0].name).toBe('Game 1');
    });

    // Test the game details endpoint
    it('should return details of a specific game', async () => {
        const response = await request(app).get('/api/games/1');

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(1);
        expect(response.body.name).toBe('Game 1');
    });

    // Test if pagination is working correctly
    it('should return paginated games', async () => {
        const response = await request(app).get('/api/games/search')
            .query({ search: 'Game', page: 1 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2); // Mock data has 2 games
    });

    // Test if no game is found
    it('should return a 404 error when game is not found', async () => {
        axios.post.mockResolvedValueOnce({ data: [] }); // Empty array, simulating no games found

        const response = await request(app).get('/api/games/999');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Game not found');
    });
});
