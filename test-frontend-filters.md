# Frontend Filter Testing Guide

## Manual Test Checklist

Visit http://localhost:4321/tours and test the following:

### 1. Country Filter
- [ ] Click on country dropdown
- [ ] Select "Albania"
- [ ] Verify only Albania tours are shown
- [ ] Select "Kosovo"
- [ ] Verify only Kosovo tours are shown
- [ ] Select "All Countries" to reset

### 2. Difficulty Filter
- [ ] Select "Easy" difficulty
- [ ] Verify only easy tours are shown
- [ ] Select "Moderate" difficulty
- [ ] Verify only moderate tours are shown
- [ ] Select "All Difficulties" to reset

### 3. Duration Filter
- [ ] Enter Min: 1, Max: 3 days
- [ ] Verify only 1-3 day tours are shown
- [ ] Clear the fields to reset

### 4. Price Range Filter
- [ ] Enter Min: 50, Max: 200
- [ ] Verify only tours in that price range are shown
- [ ] Clear the fields to reset

### 5. Group Size Filter
- [ ] Select "Small Group"
- [ ] Verify filtered results (may be empty if no small group tours)
- [ ] Select "Any Group Size" to reset

### 6. Sort Options
- [ ] Select "Price: Low to High"
- [ ] Verify tours are sorted by price ascending
- [ ] Select "Duration: Short to Long"
- [ ] Verify tours are sorted by duration

### 7. Combined Filters
- [ ] Select Country: Albania
- [ ] Select Difficulty: Moderate
- [ ] Enter Max Price: 300
- [ ] Verify combined filters work correctly

### 8. Clear Filters Button
- [ ] Apply multiple filters
- [ ] Click "Clear Filters"
- [ ] Verify all filters are reset and all tours show

### 9. Load More Button
- [ ] Apply filters that return multiple pages
- [ ] Click "Load More Tours"
- [ ] Verify additional tours load with same filters applied

### 10. No Results State
- [ ] Apply very restrictive filters (e.g., price min: 1, max: 5)
- [ ] Verify "No tours found" message appears
- [ ] Click "Clear all filters" button in the message
- [ ] Verify tours reappear

## Expected Behaviors

1. **Real-time Updates**: Filters should apply after a short delay (300ms debounce)
2. **Loading State**: "Updating..." indicator should show while fetching
3. **URL Updates**: Browser URL should update with filter parameters
4. **Results Count**: Should show "X tours found" when filters are active
5. **Active Filter Count**: Mobile toggle should show number of active filters
6. **Pagination Reset**: Page should reset to 1 when filters change
7. **Error Handling**: If API fails, error message should appear

## Console Verification

Open browser console and verify:
- No JavaScript errors
- API calls show correct filter parameters
- Response contains filtered results

## API Endpoints Being Tested

- GET `/api/tours?country=Albania`
- GET `/api/tours?difficulty=easy`
- GET `/api/tours?price_min=50&price_max=200`
- GET `/api/tours?duration_min=1&duration_max=3`
- GET `/api/tours?group_size=small`
- GET `/api/tours?sort=price`
- Combined queries with multiple parameters

## Success Criteria

✅ All filters work individually
✅ Combined filters work correctly
✅ Sorting works with filters
✅ Pagination works with filters
✅ Clear filters resets everything
✅ No JavaScript errors in console
✅ Loading states display correctly
✅ Error states handle gracefully
✅ URL updates with filter state
✅ Mobile filter toggle works