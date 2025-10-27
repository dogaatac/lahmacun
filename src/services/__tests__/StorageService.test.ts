import AsyncStorage from "@react-native-async-storage/async-storage";
import { StorageService } from "../StorageService";

describe("StorageService", () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService();
    AsyncStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("set and get", () => {
    it("should store and retrieve a value", async () => {
      const key = "testKey";
      const value = { data: "test data" };

      await service.set(key, value);
      const result = await service.get(key);

      expect(result).toEqual(value);
    });

    it("should return null for non-existent key", async () => {
      const result = await service.get("nonexistent");
      expect(result).toBeNull();
    });

    it("should store different types of values", async () => {
      await service.set("string", "hello");
      await service.set("number", 42);
      await service.set("boolean", true);
      await service.set("object", { nested: { value: "test" } });
      await service.set("array", [1, 2, 3]);

      expect(await service.get("string")).toBe("hello");
      expect(await service.get("number")).toBe(42);
      expect(await service.get("boolean")).toBe(true);
      expect(await service.get("object")).toEqual({
        nested: { value: "test" },
      });
      expect(await service.get("array")).toEqual([1, 2, 3]);
    });
  });

  describe("remove", () => {
    it("should remove a stored value", async () => {
      const key = "removeTest";
      await service.set(key, "value");

      expect(await service.get(key)).toBe("value");

      await service.remove(key);
      expect(await service.get(key)).toBeNull();
    });
  });

  describe("clear", () => {
    it("should clear all stored values with app prefix", async () => {
      await service.set("key1", "value1");
      await service.set("key2", "value2");
      await service.set("key3", "value3");

      await service.clear();

      expect(await service.get("key1")).toBeNull();
      expect(await service.get("key2")).toBeNull();
      expect(await service.get("key3")).toBeNull();
    });
  });

  describe("has", () => {
    it("should check if key exists", async () => {
      const key = "existsTest";

      expect(await service.has(key)).toBe(false);

      await service.set(key, "value");
      expect(await service.has(key)).toBe(true);
    });
  });

  describe("getAllKeys", () => {
    it("should return all keys", async () => {
      await service.set("key1", "value1");
      await service.set("key2", "value2");

      const keys = await service.getAllKeys();

      expect(keys).toContain("key1");
      expect(keys).toContain("key2");
      expect(keys.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("setMultiple and getMultiple", () => {
    it("should set and get multiple values at once", async () => {
      const items = {
        multiKey1: "value1",
        multiKey2: 42,
        multiKey3: { nested: true },
      };

      await service.setMultiple(items);
      const result = await service.getMultiple(Object.keys(items));

      expect(result).toEqual(items);
    });

    it("should handle partial results in getMultiple", async () => {
      await service.set("exists", "value");

      const result = await service.getMultiple(["exists", "notexists"]);

      expect(result.exists).toBe("value");
      expect(result.notexists).toBeUndefined();
    });
  });

  describe("prefix handling", () => {
    it("should use custom prefix when set", async () => {
      service.setPrefix("@custom:");

      await service.set("test", "value");
      const result = await service.get("test");

      expect(result).toBe("value");
    });
  });

  describe("error handling", () => {
    it("should throw error when AsyncStorage fails", async () => {
      jest
        .spyOn(AsyncStorage, "setItem")
        .mockRejectedValue(new Error("Storage full"));

      await expect(service.set("key", "value")).rejects.toThrow(
        "Storage set failed"
      );
    });

    it("should throw error when get fails", async () => {
      jest
        .spyOn(AsyncStorage, "getItem")
        .mockRejectedValue(new Error("Read error"));

      await expect(service.get("key")).rejects.toThrow("Storage get failed");
    });
  });
});
