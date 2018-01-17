import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';
import Play from './play';
import Player from './model/Player';
import Notification from './model/Notification';

var hoang = new Player(1, 'Hoang', 'https://pickaface.net/gallery/avatar/unr_emilee_180112_2136_x9pmt.png');
var minh = new Player(2, 'Minh', 'https://pickaface.net/gallery/avatar/unr_jamal_180112_2132_x9i2f.png');
var long = new Player(3, 'Long', 'https://pickaface.net/gallery/avatar/unr_biba_180112_2131_2kdzozc.png');

Vue.use(Vuex);
var play = new Play();
const store = new Vuex.Store({
    state: {
        players: [],
        status: 'Wait for bet', // Wait for bet, Finished
        notifications: [],
        dices: [1, 2, 3],
        board: {
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: []
        }
    },
    mutations: {
        updateDice: (state, dices) => {
            state.dices = dices;
        },
        addPlayer: (state, player) => {
            state.players.push(player);
        },
        updatePlayerPoint: (state, { playerId, changedValue }) => {
            const player = state.players.find(p => p.id === playerId);
            player.point += changedValue;
        },
        placeBet: (state, { player, bet, choice }) => {
            state.board[choice].push({
                id: player.id,
                name: player.name,
                avatar: player.avatar,
                bet
            });
        },
        removeLosers: (state) => {
            for (const key of Object.keys(state.board)) {
                const keyInt = parseInt(key, 10);
                if (!state.dices.includes(keyInt)) {
                    state.board[key] = [];
                }
            }
        },
        clearBoard: (state) => {
            for (const key of Object.keys(state.board)) {
                state.board[key] = [];
            }
        },
        addNotification: (state, notification) => {
            notification.id = state.notifications.length;
            state.notifications.push(notification);
        }
    },
    actions: {
        rollDice({ commit }) {
            const result = play.getResult();
            commit('updateDice', result);
        },
        placeBet({ commit, state }, { player, bet, choice }) {
            if (!state.players.some(p => p.id === player.id)) {
                commit('addPlayer', player);
            }
            const existedPlayer = state.players.find(p => p.id === player.id);
            // Can not double bet
            if (state.board[choice].some(p => p.id === existedPlayer.id)) return;

            // Bonus 1 token for player who bet but have zero
            if (existedPlayer.point === 0) {
                commit('updatePlayerPoint', { playerId: existedPlayer.id, changedValue: 1 });
            }

            if (existedPlayer.point < bet) return;

            if (existedPlayer.point >= bet) {
                commit('placeBet', { player: existedPlayer, bet, choice });
                commit('updatePlayerPoint', { playerId: existedPlayer.id, changedValue: -bet });
                commit('addNotification', new Notification(existedPlayer, bet, choice));
            }
        },
        finishGame({ commit, state }) {
            commit('removeLosers');

            const dices = state.dices;
            // Return bet money
            var dicesDistinct = [...new Set(dices)];
            for (const dice of dicesDistinct) {
                const winners = state.board[dice];
                for (const winner of winners) {
                    commit('updatePlayerPoint', { playerId: winner.id, changedValue: winner.bet });
                }
            }

            // Add reward money
            for (const dice of dices) {
                const winners = state.board[dice];
                for (const winner of winners) {
                    commit('updatePlayerPoint', { playerId: winner.id, changedValue: winner.bet });
                }
            }
        },
        randomBet({ dispatch }) {
            dispatch('placeBet', { player: hoang, bet: 5, choice: 1 })
            dispatch('placeBet', { player: minh, bet: 2, choice: 3 })
            dispatch('placeBet', { player: minh, bet: 5, choice: 2 })
            dispatch('placeBet', { player: long, bet: 5, choice: 2 })
        },
        playGame({ dispatch }) {
            dispatch('rollDice');
            dispatch('finishGame');
        },
        restart({ commit }) {
            commit('clearBoard');
        }
    },
    getters: {
        leaderboard: (state) => {
            var players = [...state.players];
            return players.sort((p1, p2) => p2.point - p1.point);
        },
        notifications: (state) => {
            return state.notifications.slice(0, 5);
        }
    },
    plugins: [createLogger()]
});

window.store = store;
// Dummy data first
// Nen dung them JS notify toast

store.dispatch('placeBet', { player: hoang, bet: 5, choice: 1 })
store.dispatch('placeBet', { player: minh, bet: 2, choice: 3 })
store.dispatch('placeBet', { player: minh, bet: 5, choice: 2 })
store.dispatch('placeBet', { player: long, bet: 5, choice: 2 })

export default store;