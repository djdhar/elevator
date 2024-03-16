DROP FUNCTION IF EXISTS choose_elevator();

CREATE OR REPLACE FUNCTION choose_elevator()
  RETURNS TABLE (
               f_id               int8   
               , f_created_at      timestamptz
               , f_last_onboarded_at timestamptz
               , f_last_released_at timestamptz
               , f_is_active       bool
               , f_current_floor   int4
               )
  LANGUAGE plpgsql AS
$func$
DECLARE
    chosen_elevator RECORD;
BEGIN
    -- Select one row where is_active is false
    SELECT id, created_at, last_onboarded_at, last_released_at, is_active, current_floor
    INTO chosen_elevator
    FROM elevator
    WHERE is_active = false
    LIMIT 1
    FOR UPDATE; -- Lock the row for update

    -- Check if a row was found
    IF NOT FOUND THEN
        -- If no row was found, return null
        RETURN;
    END IF;

    -- Update is_active to true in the selected row
    UPDATE elevator
    SET is_active = true
    WHERE id = chosen_elevator.id;

    -- Return the selected row
    RETURN QUERY
      SELECT id, created_at, last_onboarded_at, last_released_at, is_active, current_floor 
      FROM elevator 
      WHERE id = chosen_elevator.id;
END;
$func$;
