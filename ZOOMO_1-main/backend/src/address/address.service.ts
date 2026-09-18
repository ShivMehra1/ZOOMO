import {
  Injectable,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { geocodeAddress } from "../common/geocode.util";
import { resolveJourianCoords } from "../common/jourian-areas.util";
import { haversineKm } from "../common/geo.util";

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  /* ===========================
     GET USER ADDRESSES
  =========================== */
  getUserAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /* ===========================
     CREATE ADDRESS (WITH GEO)
  =========================== */
  async createAddress(userId: string, data: any) {
    const {
      street,
      city,
      state,
      zipCode,
      country = "India",
      isDefault,
    } = data;

    if (!street || !city || !state || !zipCode) {
      throw new BadRequestException(
        "Incomplete address details"
      );
    }

    const lat = typeof data.lat === "number" ? data.lat : null;
    const lng = typeof data.lng === "number" ? data.lng : null;
    let geo = lat != null && lng != null ? { lat, lng } : null;
    const town = resolveJourianCoords(`${street} ${city}`);
    if (geo && haversineKm(geo.lat, geo.lng, town.lat, town.lng) > 20) {
      geo = /jourian|jammu/i.test(`${city} ${state}`) ? town : geo;
    }
    if (!geo) {
      const fullAddress = `${street}, ${city}, ${state}, ${zipCode}, ${country}`;
      geo = await geocodeAddress(fullAddress);
      if (!geo || (/jourian|jammu/i.test(`${city} ${state}`) && haversineKm(geo.lat, geo.lng, town.lat, town.lng) > 20)) {
        geo = town;
      }
    }

    return this.prisma.address.create({
      data: {
        street,
        city,
        state,
        zipCode,
        country,
        isDefault: isDefault ?? false,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
        userId,
      },
    });
  }

  /* ===========================
     UPDATE ADDRESS (RE-GEO)
  =========================== */
  async updateAddress(
    id: string,
    userId: string,
    data: any
  ) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new BadRequestException(
        "Address not found"
      );
    }

    const street = data.street ?? address.street;
    const city = data.city ?? address.city;
    const state = data.state ?? address.state;
    const zipCode = data.zipCode ?? address.zipCode;
    const country =
      data.country ?? address.country ?? "India";

    const fullAddress = `${street}, ${city}, ${state}, ${zipCode}, ${country}`;

    // 🌍 RE-GEOCODE ON UPDATE
    const location = await geocodeAddress(fullAddress);

    return this.prisma.address.update({
      where: { id },
      data: {
        ...data,
        lat: location?.lat ?? address.lat,
        lng: location?.lng ?? address.lng,
      },
    });
  }

  /* ===========================
     DELETE ADDRESS
  =========================== */
  async deleteAddress(id: string, userId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new BadRequestException(
        "Address not found"
      );
    }

    return this.prisma.address.delete({
      where: { id },
    });
  }
}
