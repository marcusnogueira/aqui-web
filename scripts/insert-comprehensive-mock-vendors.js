const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mock vendor data based on schema requirements
const mockVendors = [
  // Bay Area (20 vendors)
  {
    business_name: "Golden Gate Tacos",
    description: "Authentic Mexican street tacos with fresh ingredients",
    business_type: "Food Truck",
    subcategory: "Mexican",
    tags: ["tacos", "mexican", "street food", "authentic"],
    contact_email: "info@goldengatestacos.com",
    phone: "+1-415-555-0101",
    address: "Mission District, San Francisco, CA",
    latitude: 37.7599,
    longitude: -122.4148,
    city: "San Francisco",
    is_active: true,
    is_approved: true,
    average_rating: 4.5,
    total_reviews: 127
  },
  {
    business_name: "Bay Burger Co",
    description: "Gourmet burgers made with locally sourced ingredients",
    business_type: "Food Truck",
    subcategory: "American",
    tags: ["burgers", "gourmet", "local", "beef"],
    contact_email: "orders@bayburgerco.com",
    phone: "+1-415-555-0102",
    address: "Fisherman's Wharf, San Francisco, CA",
    latitude: 37.8080,
    longitude: -122.4177,
    city: "San Francisco",
    is_active: true,
    is_approved: true,
    average_rating: 4.2,
    total_reviews: 89
  },
  {
    business_name: "Oakland BBQ Express",
    description: "Slow-smoked BBQ with homemade sauces",
    business_type: "Food Truck",
    subcategory: "BBQ",
    tags: ["bbq", "smoked", "ribs", "brisket"],
    contact_email: "hello@oaklandbbq.com",
    phone: "+1-510-555-0103",
    address: "Jack London Square, Oakland, CA",
    latitude: 37.7955,
    longitude: -122.2730,
    city: "Oakland",
    is_active: true,
    is_approved: true,
    average_rating: 4.7,
    total_reviews: 156
  },
  {
    business_name: "Berkeley Bowl Bites",
    description: "Fresh poke bowls and Asian fusion",
    business_type: "Food Truck",
    subcategory: "Asian Fusion",
    tags: ["poke", "healthy", "fresh", "asian"],
    contact_email: "info@berkeleybowl.com",
    phone: "+1-510-555-0104",
    address: "UC Berkeley Campus, Berkeley, CA",
    latitude: 37.8719,
    longitude: -122.2585,
    city: "Berkeley",
    is_active: true,
    is_approved: true,
    average_rating: 4.3,
    total_reviews: 92
  },
  {
    business_name: "Marin Coffee Cart",
    description: "Artisan coffee and pastries",
    business_type: "Coffee Cart",
    subcategory: "Coffee",
    tags: ["coffee", "artisan", "pastries", "organic"],
    contact_email: "brew@marincoffee.com",
    phone: "+1-415-555-0105",
    address: "Sausalito Waterfront, Sausalito, CA",
    latitude: 37.8590,
    longitude: -122.4852,
    city: "Sausalito",
    is_active: true,
    is_approved: true,
    average_rating: 4.6,
    total_reviews: 203
  },
  {
    business_name: "Peninsula Pizza Mobile",
    description: "Wood-fired pizza made fresh to order",
    business_type: "Food Truck",
    subcategory: "Italian",
    tags: ["pizza", "wood-fired", "fresh", "italian"],
    contact_email: "orders@peninsulapizza.com",
    phone: "+1-650-555-0106",
    address: "Palo Alto Downtown, Palo Alto, CA",
    latitude: 37.4419,
    longitude: -122.1430,
    city: "Palo Alto",
    is_active: true,
    is_approved: true,
    average_rating: 4.4,
    total_reviews: 78
  },
  {
    business_name: "Fremont Fusion",
    description: "Korean-Mexican fusion street food",
    business_type: "Food Truck",
    subcategory: "Fusion",
    tags: ["korean", "mexican", "fusion", "kimchi"],
    contact_email: "hello@fremontfusion.com",
    phone: "+1-510-555-0107",
    address: "Central Park, Fremont, CA",
    latitude: 37.5485,
    longitude: -121.9886,
    city: "Fremont",
    is_active: true,
    is_approved: true,
    average_rating: 4.1,
    total_reviews: 64
  },
  {
    business_name: "Hayward Hot Dogs",
    description: "Gourmet hot dogs with unique toppings",
    business_type: "Food Cart",
    subcategory: "American",
    tags: ["hot dogs", "gourmet", "sausages", "quick"],
    contact_email: "info@haywardhotdogs.com",
    phone: "+1-510-555-0108",
    address: "Hayward City Center, Hayward, CA",
    latitude: 37.6688,
    longitude: -122.0808,
    city: "Hayward",
    is_active: true,
    is_approved: true,
    average_rating: 3.9,
    total_reviews: 45
  },
  {
    business_name: "Richmond Ramen",
    description: "Authentic Japanese ramen and sides",
    business_type: "Food Truck",
    subcategory: "Japanese",
    tags: ["ramen", "japanese", "noodles", "authentic"],
    contact_email: "orders@richmondramen.com",
    phone: "+1-510-555-0109",
    address: "Point Richmond, Richmond, CA",
    latitude: 37.9161,
    longitude: -122.3774,
    city: "Richmond",
    is_active: true,
    is_approved: true,
    average_rating: 4.8,
    total_reviews: 134
  },
  {
    business_name: "Concord Crepes",
    description: "Sweet and savory French crepes",
    business_type: "Food Cart",
    subcategory: "French",
    tags: ["crepes", "french", "sweet", "savory"],
    contact_email: "bonjour@concordcrepes.com",
    phone: "+1-925-555-0110",
    address: "Todos Santos Plaza, Concord, CA",
    latitude: 37.9780,
    longitude: -122.0311,
    city: "Concord",
    is_active: true,
    is_approved: true,
    average_rating: 4.2,
    total_reviews: 67
  },
  {
    business_name: "Walnut Creek Wings",
    description: "Buffalo wings and craft beer",
    business_type: "Food Truck",
    subcategory: "American",
    tags: ["wings", "buffalo", "beer", "spicy"],
    contact_email: "wings@walnutcreek.com",
    phone: "+1-925-555-0111",
    address: "Downtown Walnut Creek, Walnut Creek, CA",
    latitude: 37.9063,
    longitude: -122.0653,
    city: "Walnut Creek",
    is_active: true,
    is_approved: true,
    average_rating: 4.0,
    total_reviews: 88
  },
  {
    business_name: "Antioch Arepas",
    description: "Venezuelan arepas and Latin specialties",
    business_type: "Food Truck",
    subcategory: "Venezuelan",
    tags: ["arepas", "venezuelan", "latin", "corn"],
    contact_email: "hola@antiocharepas.com",
    phone: "+1-925-555-0112",
    address: "Rivertown District, Antioch, CA",
    latitude: 38.0049,
    longitude: -121.8058,
    city: "Antioch",
    is_active: true,
    is_approved: true,
    average_rating: 4.3,
    total_reviews: 52
  },
  {
    business_name: "Livermore Lobster",
    description: "Fresh lobster rolls and seafood",
    business_type: "Food Truck",
    subcategory: "Seafood",
    tags: ["lobster", "seafood", "fresh", "rolls"],
    contact_email: "catch@livermorelobster.com",
    phone: "+1-925-555-0113",
    address: "Downtown Livermore, Livermore, CA",
    latitude: 37.6819,
    longitude: -121.7680,
    city: "Livermore",
    is_active: true,
    is_approved: true,
    average_rating: 4.5,
    total_reviews: 76
  },
  {
    business_name: "Pleasanton Pho",
    description: "Traditional Vietnamese pho and banh mi",
    business_type: "Food Truck",
    subcategory: "Vietnamese",
    tags: ["pho", "vietnamese", "banh mi", "traditional"],
    contact_email: "info@pleasantonpho.com",
    phone: "+1-925-555-0114",
    address: "Main Street, Pleasanton, CA",
    latitude: 37.6624,
    longitude: -121.8747,
    city: "Pleasanton",
    is_active: true,
    is_approved: true,
    average_rating: 4.6,
    total_reviews: 98
  },
  {
    business_name: "Dublin Donuts",
    description: "Fresh donuts and coffee daily",
    business_type: "Food Cart",
    subcategory: "Bakery",
    tags: ["donuts", "coffee", "fresh", "bakery"],
    contact_email: "sweet@dublindonuts.com",
    phone: "+1-925-555-0115",
    address: "Dublin Boulevard, Dublin, CA",
    latitude: 37.7022,
    longitude: -121.9358,
    city: "Dublin",
    is_active: true,
    is_approved: true,
    average_rating: 4.1,
    total_reviews: 112
  },
  {
    business_name: "San Leandro Sandwiches",
    description: "Deli sandwiches and soups",
    business_type: "Food Truck",
    subcategory: "Deli",
    tags: ["sandwiches", "deli", "soups", "fresh"],
    contact_email: "orders@sanleandrosandwiches.com",
    phone: "+1-510-555-0116",
    address: "Marina Park, San Leandro, CA",
    latitude: 37.7249,
    longitude: -122.1561,
    city: "San Leandro",
    is_active: true,
    is_approved: true,
    average_rating: 3.8,
    total_reviews: 43
  },
  {
    business_name: "Castro Valley Curry",
    description: "Indian curry and naan bread",
    business_type: "Food Truck",
    subcategory: "Indian",
    tags: ["curry", "indian", "naan", "spices"],
    contact_email: "spice@castrovalleycurry.com",
    phone: "+1-510-555-0117",
    address: "Castro Valley Marketplace, Castro Valley, CA",
    latitude: 37.6941,
    longitude: -122.0863,
    city: "Castro Valley",
    is_active: true,
    is_approved: true,
    average_rating: 4.4,
    total_reviews: 87
  },
  {
    business_name: "Union City Udon",
    description: "Fresh udon noodles and tempura",
    business_type: "Food Truck",
    subcategory: "Japanese",
    tags: ["udon", "japanese", "noodles", "tempura"],
    contact_email: "noodles@unioncityudon.com",
    phone: "+1-510-555-0118",
    address: "Alvarado Park, Union City, CA",
    latitude: 37.5934,
    longitude: -122.0439,
    city: "Union City",
    is_active: true,
    is_approved: true,
    average_rating: 4.2,
    total_reviews: 61
  },
  {
    business_name: "Newark Nachos",
    description: "Loaded nachos and Mexican appetizers",
    business_type: "Food Cart",
    subcategory: "Mexican",
    tags: ["nachos", "mexican", "loaded", "appetizers"],
    contact_email: "cheese@newarknachos.com",
    phone: "+1-510-555-0119",
    address: "NewPark Mall, Newark, CA",
    latitude: 37.5297,
    longitude: -122.0402,
    city: "Newark",
    is_active: true,
    is_approved: true,
    average_rating: 3.9,
    total_reviews: 34
  },
  {
    business_name: "Milpitas Mediterranean",
    description: "Greek and Mediterranean specialties",
    business_type: "Food Truck",
    subcategory: "Mediterranean",
    tags: ["mediterranean", "greek", "gyros", "falafel"],
    contact_email: "opa@milpitasmed.com",
    phone: "+1-408-555-0120",
    address: "Great Mall, Milpitas, CA",
    latitude: 37.4323,
    longitude: -121.8995,
    city: "Milpitas",
    is_active: true,
    is_approved: true,
    average_rating: 4.3,
    total_reviews: 79
  },

  // San Jose (7 vendors)
  {
    business_name: "San Jose Sushi",
    description: "Fresh sushi and sashimi",
    business_type: "Food Truck",
    subcategory: "Japanese",
    tags: ["sushi", "sashimi", "fresh", "japanese"],
    contact_email: "fresh@sanjosesushi.com",
    phone: "+1-408-555-0201",
    address: "Santana Row, San Jose, CA",
    latitude: 37.3212,
    longitude: -121.9480,
    city: "San Jose",
    is_active: true,
    is_approved: true,
    average_rating: 4.7,
    total_reviews: 145
  },
  {
    business_name: "Silicon Valley Sliders",
    description: "Mini burgers and tech-themed snacks",
    business_type: "Food Truck",
    subcategory: "American",
    tags: ["sliders", "burgers", "tech", "mini"],
    contact_email: "code@svsliders.com",
    phone: "+1-408-555-0202",
    address: "Downtown San Jose, San Jose, CA",
    latitude: 37.3382,
    longitude: -121.8863,
    city: "San Jose",
    is_active: true,
    is_approved: true,
    average_rating: 4.1,
    total_reviews: 92
  },
  {
    business_name: "Willow Glen Waffles",
    description: "Belgian waffles and breakfast treats",
    business_type: "Food Cart",
    subcategory: "Breakfast",
    tags: ["waffles", "belgian", "breakfast", "sweet"],
    contact_email: "syrup@willowglenwaffles.com",
    phone: "+1-408-555-0203",
    address: "Lincoln Avenue, San Jose, CA",
    latitude: 37.3068,
    longitude: -121.8905,
    city: "San Jose",
    is_active: true,
    is_approved: true,
    average_rating: 4.4,
    total_reviews: 68
  },
  {
    business_name: "Almaden Empanadas",
    description: "Argentinian empanadas and chimichurri",
    business_type: "Food Truck",
    subcategory: "Argentinian",
    tags: ["empanadas", "argentinian", "chimichurri", "baked"],
    contact_email: "buenos@almadenempanadas.com",
    phone: "+1-408-555-0204",
    address: "Almaden Lake Park, San Jose, CA",
    latitude: 37.2358,
    longitude: -121.8580,
    city: "San Jose",
    is_active: true,
    is_approved: true,
    average_rating: 4.5,
    total_reviews: 83
  },
  {
    business_name: "Cambrian Churros",
    description: "Fresh churros and Mexican sweets",
    business_type: "Food Cart",
    subcategory: "Dessert",
    tags: ["churros", "mexican", "sweets", "cinnamon"],
    contact_email: "dulce@cambrianchurros.com",
    phone: "+1-408-555-0205",
    address: "Cambrian Park, San Jose, CA",
    latitude: 37.2647,
    longitude: -121.9358,
    city: "San Jose",
    is_active: true,
    is_approved: true,
    average_rating: 4.2,
    total_reviews: 56
  },
  {
    business_name: "Evergreen Eats",
    description: "Healthy bowls and smoothies",
    business_type: "Food Truck",
    subcategory: "Healthy",
    tags: ["healthy", "bowls", "smoothies", "organic"],
    contact_email: "green@evergreeneats.com",
    phone: "+1-408-555-0206",
    address: "Evergreen Valley, San Jose, CA",
    latitude: 37.3197,
    longitude: -121.7908,
    city: "San Jose",
    is_active: true,
    is_approved: true,
    average_rating: 4.6,
    total_reviews: 104
  },
  {
    business_name: "Berryessa Boba",
    description: "Bubble tea and Asian drinks",
    business_type: "Beverage Cart",
    subcategory: "Beverages",
    tags: ["boba", "bubble tea", "asian", "drinks"],
    contact_email: "bubble@berryessaboba.com",
    phone: "+1-408-555-0207",
    address: "Berryessa Flea Market, San Jose, CA",
    latitude: 37.4419,
    longitude: -121.8580,
    city: "San Jose",
    is_active: true,
    is_approved: true,
    average_rating: 4.3,
    total_reviews: 127
  },

  // San Bruno (3 vendors)
  {
    business_name: "Bruno's Bagels",
    description: "Fresh bagels and cream cheese varieties",
    business_type: "Food Cart",
    subcategory: "Bakery",
    tags: ["bagels", "cream cheese", "fresh", "breakfast"],
    contact_email: "fresh@brunosbagels.com",
    phone: "+1-650-555-0301",
    address: "San Bruno City Park, San Bruno, CA",
    latitude: 37.6305,
    longitude: -122.4111,
    city: "San Bruno",
    is_active: true,
    is_approved: true,
    average_rating: 4.1,
    total_reviews: 47
  },
  {
    business_name: "Skyline Sandwiches",
    description: "Gourmet sandwiches and salads",
    business_type: "Food Truck",
    subcategory: "Deli",
    tags: ["sandwiches", "gourmet", "salads", "fresh"],
    contact_email: "lunch@skylinesandwiches.com",
    phone: "+1-650-555-0302",
    address: "Skyline Boulevard, San Bruno, CA",
    latitude: 37.6358,
    longitude: -122.4264,
    city: "San Bruno",
    is_active: true,
    is_approved: true,
    average_rating: 4.0,
    total_reviews: 38
  },
  {
    business_name: "Tanforan Tapioca",
    description: "Taiwanese bubble tea and snacks",
    business_type: "Beverage Cart",
    subcategory: "Taiwanese",
    tags: ["bubble tea", "taiwanese", "tapioca", "snacks"],
    contact_email: "tea@tanforantapioca.com",
    phone: "+1-650-555-0303",
    address: "Tanforan Mall, San Bruno, CA",
    latitude: 37.6358,
    longitude: -122.4197,
    city: "San Bruno",
    is_active: true,
    is_approved: true,
    average_rating: 4.2,
    total_reviews: 62
  },

  // Austin (2 vendors)
  {
    business_name: "Austin BBQ Pit",
    description: "Texas-style BBQ and brisket",
    business_type: "Food Truck",
    subcategory: "BBQ",
    tags: ["bbq", "texas", "brisket", "smoked"],
    contact_email: "smoke@austinbbqpit.com",
    phone: "+1-512-555-0401",
    address: "South by Southwest, Austin, TX",
    latitude: 30.2672,
    longitude: -97.7431,
    city: "Austin",
    is_active: true,
    is_approved: true,
    average_rating: 4.8,
    total_reviews: 234
  },
  {
    business_name: "Keep Austin Weird Waffles",
    description: "Unique waffle creations and local flavors",
    business_type: "Food Cart",
    subcategory: "Breakfast",
    tags: ["waffles", "weird", "unique", "local"],
    contact_email: "weird@austinwaffles.com",
    phone: "+1-512-555-0402",
    address: "6th Street, Austin, TX",
    latitude: 30.2669,
    longitude: -97.7428,
    city: "Austin",
    is_active: true,
    is_approved: true,
    average_rating: 4.3,
    total_reviews: 156
  },

  // Lima (5 vendors)
  {
    business_name: "Lima Ceviche Express",
    description: "Fresh ceviche and Peruvian seafood",
    business_type: "Food Truck",
    subcategory: "Peruvian",
    tags: ["ceviche", "peruvian", "seafood", "fresh"],
    contact_email: "fresco@limaceviche.com",
    phone: "+51-1-555-0501",
    address: "Miraflores, Lima, Peru",
    latitude: -12.1196,
    longitude: -77.0365,
    city: "Lima",
    is_active: true,
    is_approved: true,
    average_rating: 4.9,
    total_reviews: 312
  },
  {
    business_name: "Anticuchos Don Carlos",
    description: "Traditional Peruvian anticuchos and grilled meats",
    business_type: "Food Cart",
    subcategory: "Peruvian",
    tags: ["anticuchos", "grilled", "traditional", "meat"],
    contact_email: "parrilla@anticuchoscarlos.com",
    phone: "+51-1-555-0502",
    address: "Barranco, Lima, Peru",
    latitude: -12.1464,
    longitude: -77.0206,
    city: "Lima",
    is_active: true,
    is_approved: true,
    average_rating: 4.6,
    total_reviews: 189
  },
  {
    business_name: "Pollo a la Brasa Norteño",
    description: "Rotisserie chicken with aji verde sauce",
    business_type: "Food Truck",
    subcategory: "Peruvian",
    tags: ["pollo", "rotisserie", "aji verde", "chicken"],
    contact_email: "pollo@pollonorteno.com",
    phone: "+51-1-555-0503",
    address: "San Isidro, Lima, Peru",
    latitude: -12.0931,
    longitude: -77.0465,
    city: "Lima",
    is_active: true,
    is_approved: true,
    average_rating: 4.4,
    total_reviews: 167
  },
  {
    business_name: "Causa Limeña",
    description: "Traditional causa and Peruvian appetizers",
    business_type: "Food Cart",
    subcategory: "Peruvian",
    tags: ["causa", "appetizers", "potato", "traditional"],
    contact_email: "causa@causalimena.com",
    phone: "+51-1-555-0504",
    address: "Pueblo Libre, Lima, Peru",
    latitude: -12.0732,
    longitude: -77.0617,
    city: "Lima",
    is_active: true,
    is_approved: true,
    average_rating: 4.2,
    total_reviews: 94
  },
  {
    business_name: "Churros Rellenos",
    description: "Filled churros with dulce de leche and chocolate",
    business_type: "Dessert Cart",
    subcategory: "Dessert",
    tags: ["churros", "dulce de leche", "chocolate", "filled"],
    contact_email: "dulce@churrosrellenos.com",
    phone: "+51-1-555-0505",
    address: "Centro Histórico, Lima, Peru",
    latitude: -12.0464,
    longitude: -77.0428,
    city: "Lima",
    is_active: true,
    is_approved: true,
    average_rating: 4.5,
    total_reviews: 128
  }
];

async function createMockUsers() {
  console.log('Creating mock users...');
  const users = [];
  
  for (let i = 0; i < mockVendors.length; i++) {
    const vendor = mockVendors[i];
    const email = vendor.contact_email;
    const name = vendor.business_name.replace(/[^a-zA-Z\s]/g, '').trim();
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'TempPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: name,
          is_vendor: true
        }
      });
      
      if (authError) {
        console.log(`Auth user might already exist for ${email}:`, authError.message);
        // Try to get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === email);
        if (existingUser) {
          users.push(existingUser.id);
          continue;
        }
      } else {
        console.log(`Created auth user: ${email}`);
        users.push(authData.user.id);
      }
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData?.user?.id || users[users.length - 1],
          full_name: name,
          email: email,
          is_vendor: true,
          active_role: 'vendor'
        });
        
      if (profileError) {
        console.log(`Profile error for ${email}:`, profileError.message);
      }
      
    } catch (error) {
      console.error(`Error creating user ${email}:`, error.message);
    }
  }
  
  return users;
}

async function insertMockVendors() {
  try {
    console.log('Starting mock vendor insertion...');
    
    // Create users first
    const userIds = await createMockUsers();
    
    if (userIds.length === 0) {
      throw new Error('No users were created');
    }
    
    console.log(`Created ${userIds.length} users`);
    
    // Prepare vendor data with user IDs
    const vendorsToInsert = mockVendors.map((vendor, index) => ({
      ...vendor,
      user_id: userIds[index] || userIds[0] // Fallback to first user if needed
    }));
    
    // Insert vendors
    const { data, error } = await supabase
      .from('vendors')
      .insert(vendorsToInsert)
      .select();
    
    if (error) {
      console.error('Error inserting vendors:', error);
      return;
    }
    
    console.log(`Successfully inserted ${data.length} vendors`);
    
    // Create some live sessions for active vendors
    const liveSessions = [];
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const vendor = data[i];
      const originalVendor = mockVendors[i];
      
      liveSessions.push({
        vendor_id: vendor.id,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        auto_end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        latitude: originalVendor.latitude,
        longitude: originalVendor.longitude,
        address: originalVendor.address,
        is_active: true,
        estimated_customers: Math.floor(Math.random() * 20) + 5
      });
    }
    
    if (liveSessions.length > 0) {
      const { error: sessionError } = await supabase
        .from('vendor_live_sessions')
        .insert(liveSessions);
        
      if (sessionError) {
        console.error('Error inserting live sessions:', sessionError);
      } else {
        console.log(`Created ${liveSessions.length} live sessions`);
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total vendors inserted: ${data.length}`);
    console.log(`Bay Area vendors: 20`);
    console.log(`San Jose vendors: 7`);
    console.log(`San Bruno vendors: 3`);
    console.log(`Austin vendors: 2`);
    console.log(`Lima vendors: 5`);
    console.log(`Active live sessions: ${liveSessions.length}`);
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

insertMockVendors();