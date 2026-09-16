-- Reverting group-order scope: these columns were added moments ago in the
-- previous migration and never used by any application code, so this drops
-- them with zero data loss.
ALTER TABLE "CartItem" DROP COLUMN "orderedBy";
ALTER TABLE "OrderItem" DROP COLUMN "orderedBy";
