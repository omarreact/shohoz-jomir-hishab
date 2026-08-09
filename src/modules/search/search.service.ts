import "reflect-metadata";
import { injectable } from "tsyringe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/src/modules/database/prisma";
import { RedisCacheWrapper } from "@/lib/rajuk/cache";
import { getRedisClient } from "@/lib/redis";

export interface SearchQuery {
  q?: string;
  mouza?: string;
  page?: number;
  limit?: number;
  sortBy?: "plotNo" | "mouza" | "createdAt";
  sortOrder?: "asc" | "desc";
}

@injectable()
export class SearchService {
  private cache: RedisCacheWrapper | null = null;

  constructor() {
    const redisClient = getRedisClient();
    if (redisClient) {
      this.cache = new RedisCacheWrapper(redisClient);
    }
  }

  /**
   * Search and filter plots with pagination.
   */
  async searchPlots(params: SearchQuery) {
    try {
      const {
        q,
        mouza,
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = params;

      const skip = (page - 1) * limit;

      const where: Prisma.RajukPlotWhereInput = {};

      if (q) {
        where.OR = [
          { plotNo: { contains: q } },
          { khatiyanNo: { contains: q } },
          { mouza: { contains: q } },
        ];
      }

      if (mouza) {
        where.mouza = { contains: mouza };
      }

      const orderBy: Prisma.RajukPlotOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [total, plots] = await Promise.all([
        prisma.rajukPlot.count({ where }),
        prisma.rajukPlot.findMany({
          where,
          orderBy,
          skip,
          take: Number(limit),
        }),
      ]);

      const response = {
        data: plots,
        meta: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      };

      return response;
    } catch (error: unknown) {
      console.error("Error searching plots");
      throw new Error("Failed to search plots");
    }
  }

  /**
   * Sync plot data from Rajuk GIS into our local database cache.
   * This allows us to perform fast, structured searches on it.
   */
  async syncPlot(plotData: Record<string, unknown>) {
    try {
      if (!plotData.OBJECTID) {
        throw new Error("Invalid plot data: Missing OBJECTID");
      }

      return await prisma.rajukPlot.upsert({
        where: { id: plotData.OBJECTID as string },
        update: {
          plotNo: plotData.Plot_No as string,
          mouza: plotData.Mouza as string,
          khatiyanNo: plotData.Khatian_No as string,
          landType: plotData.Land_Use as string,
          area: plotData.Area ? Number(plotData.Area) : undefined,
          rawFeature: plotData.rawFeature as string,
        },
        create: {
          id: plotData.OBJECTID as string,
          plotNo: plotData.Plot_No as string,
          mouza: plotData.Mouza as string,
          khatiyanNo: plotData.Khatian_No as string,
          landType: plotData.Land_Use as string,
          area: plotData.Area ? Number(plotData.Area) : undefined,
          rawFeature: plotData.rawFeature as string,
        },
      });
    } catch (error: unknown) {
      console.error("Error syncing plot");
      throw error;
    }
  }
}
