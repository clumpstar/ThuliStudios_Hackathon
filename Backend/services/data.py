from models.schemas import QuizImage, ImageMetadata

# This is your dataset of initial quiz images.
# In a real application, this would come from a database.
INITIAL_QUIZ_IMAGES: list[QuizImage] = [
    QuizImage(id=1, name='Casual Chic', uri='https://placehold.co/300x450?text=Casual+Chic', metadata=ImageMetadata(gender='female', type='dress', primary_color='white', pattern='solid')),
    QuizImage(id=2, name='Bohemian Flow', uri='https://placehold.co/300x450?text=Bohemian', metadata=ImageMetadata(gender='female', type='dress', primary_color='earth_tones', pattern='floral')),
    QuizImage(id=3, name='Modern Minimalist', uri='https://placehold.co/300x450?text=Minimalist', metadata=ImageMetadata(gender='unisex', type='shirt', primary_color='black', pattern='solid')),
    QuizImage(id=4, name='Streetwear Edge', uri='https://placehold.co/300x450?text=Streetwear', metadata=ImageMetadata(gender='male', type='jacket', primary_color='grey', pattern='graphic')),
    QuizImage(id=5, name='Vintage Glamour', uri='https://placehold.co/300x450?text=Vintage', metadata=ImageMetadata(gender='female', type='dress', primary_color='red', pattern='polka_dot')),
    QuizImage(id=6, name='Sporty Athleisure', uri='https://placehold.co/300x450?text=Athleisure', metadata=ImageMetadata(gender='unisex', type='jacket', primary_color='blue', pattern='striped')),
    QuizImage(id=7, name='Preppy Classic', uri='https://placehold.co/300x450?text=Preppy', metadata=ImageMetadata(gender='male', type='shirt', primary_color='light_blue', pattern='solid')),
    QuizImage(id=8, name='Gothic Noir', uri='https://placehold.co/300x450?text=Gothic', metadata=ImageMetadata(gender='unisex', type='jacket', primary_color='black', pattern='solid')),
    QuizImage(id=9, name='Business Casual', uri='https://placehold.co/300x450?text=Business', metadata=ImageMetadata(gender='male', type='pant', primary_color='khaki', pattern='solid')),
    QuizImage(id=10, name='Artsy & Eclectic', uri='https://placehold.co/300x450?text=Artsy', metadata=ImageMetadata(gender='female', type='dress', primary_color='multi-color', pattern='tribal')),
    # ... (add 20 more images to reach 30)
    QuizImage(id=11, name='Techwear Functional', uri='https://placehold.co/300x450?text=Techwear', metadata=ImageMetadata(gender='unisex', type='jacket', primary_color='black', pattern='solid')),
    QuizImage(id=12, name='Grunge Revival', uri='https://placehold.co/300x450?text=Grunge', metadata=ImageMetadata(gender='unisex', type='shirt', primary_color='red', pattern='striped')),
    QuizImage(id=13, name='Pastel Dreams', uri='https://placehold.co/300x450?text=Pastel', metadata=ImageMetadata(gender='female', type='dress', primary_color='pink', pattern='solid')),
    QuizImage(id=14, name='Safari Utility', uri='https://placehold.co/300x450?text=Safari', metadata=ImageMetadata(gender='male', type='jacket', primary_color='olive', pattern='solid')),
    QuizImage(id=15, name='Nautical Stripes', uri='https://placehold.co/300x450?text=Nautical', metadata=ImageMetadata(gender='unisex', type='shirt', primary_color='blue', pattern='striped')),
    QuizImage(id=16, name='Elegant Eveningwear', uri='https://placehold.co/300x450?text=Eveningwear', metadata=ImageMetadata(gender='female', type='dress', primary_color='black', pattern='solid')),
    QuizImage(id=17, name='Punk Rock Rebel', uri='https://placehold.co/300x450?text=Punk', metadata=ImageMetadata(gender='unisex', type='jacket', primary_color='black', pattern='graphic')),
    QuizImage(id=18, name='Tropical Vacation', uri='https://placehold.co/300x450?text=Tropical', metadata=ImageMetadata(gender='male', type='shirt', primary_color='multi-color', pattern='floral')),
    QuizImage(id=19, name='Cozy Knitwear', uri='https://placehold.co/300x450?text=Knitwear', metadata=ImageMetadata(gender='unisex', type='shirt', primary_color='beige', pattern='solid')),
    QuizImage(id=20, name='Denim on Denim', uri='https://placehold.co/300x450?text=Denim', metadata=ImageMetadata(gender='unisex', type='jacket', primary_color='blue', pattern='solid')),
    QuizImage(id=21, name='Formal Suit', uri='https://placehold.co/300x450?text=Suit', metadata=ImageMetadata(gender='male', type='jacket', primary_color='charcoal', pattern='solid')),
    QuizImage(id=22, name='Vibrant Activewear', uri='https://placehold.co/300x450?text=Activewear', metadata=ImageMetadata(gender='female', type='shirt', primary_color='neon_green', pattern='solid')),
    QuizImage(id=23, name='Leather Biker', uri='https://placehold.co/300x450?text=Biker', metadata=ImageMetadata(gender='unisex', type='jacket', primary_color='black', pattern='solid')),
    QuizImage(id=24, name='Flowy Maxi Dress', uri='https://placehold.co/300x450?text=Maxi+Dress', metadata=ImageMetadata(gender='female', type='dress', primary_color='yellow', pattern='floral')),
    QuizImage(id=25, name='Smart Tailored Coat', uri='https://placehold.co/300x450?text=Coat', metadata=ImageMetadata(gender='male', type='jacket', primary_color='camel', pattern='solid')),
    QuizImage(id=26, name='Loud Graphic Hoodie', uri='https://placehold.co/300x450?text=Hoodie', metadata=ImageMetadata(gender='unisex', type='shirt', primary_color='orange', pattern='graphic')),
    QuizImage(id=27, name='Silk Blouse', uri='https://placehold.co/300x450?text=Blouse', metadata=ImageMetadata(gender='female', type='shirt', primary_color='ivory', pattern='solid')),
    QuizImage(id=28, name='Linen Trousers', uri='https://placehold.co/300x450?text=Trousers', metadata=ImageMetadata(gender='male', type='pant', primary_color='white', pattern='solid')),
    QuizImage(id=29, name='Pleated Skirt', uri='https://placehold.co/300x450?text=Skirt', metadata=ImageMetadata(gender='female', type='accessory', primary_color='green', pattern='solid')),
    QuizImage(id=30, name='Designer Sunglasses', uri='https://placehold.co/300x450?text=Sunglasses', metadata=ImageMetadata(gender='unisex', type='accessory', primary_color='black', pattern='solid')),
]

def get_initial_quiz_images():
    return INITIAL_QUIZ_IMAGES

