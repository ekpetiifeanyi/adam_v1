class AddressCache {
    constructor() {
        this.cache = new Map();
    }

    set(address, data) {
        this.cache.set(address.toLowerCase(), data);
    }

    get(address) {
        return this.cache.get(address.toLowerCase());
    }

    has(address) {
        return this.cache.has(address.toLowerCase());
    }

    getAll() {
        return Array.from(this.cache.entries());
    }

    delete(address) {
        this.cache.delete(address.toLowerCase());
    }

    clear() {
        this.cache.clear();
    }
}

module.exports = new AddressCache();