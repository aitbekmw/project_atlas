import pytest


@pytest.mark.asyncio
async def test_create_get_and_delete_review(
    client,
    customer_headers,
    auth_headers,
):
    # Создаем категорию
    category = await client.post(
        "/categories",
        json={
            "name": "IT",
            "description": "Information Technology",
        },
    )

    assert category.status_code == 201
    category_data = category.json()

    # Создаем вакансию
    job = await client.post(
        "/jobs",
        json={
            "title": "Backend Developer",
            "description": "Need FastAPI developer",
            "salary": 5000,
            "city": "Bishkek",
            "address": "Chui 100",
            "category_id": category_data["id"],
        },
        headers=customer_headers,
    )

    assert job.status_code == 201
    job_data = job.json()

    # Завершаем вакансию
    complete = await client.post(
        f"/jobs/{job_data['id']}/complete",
        headers=customer_headers,
    )

    print(complete.status_code)
    print(complete.json())

    assert complete.status_code == 200

    # Получаем worker
    me = await client.get(
        "/users/me",
        headers=auth_headers,
    )

    assert me.status_code == 200
    worker = me.json()

    # Создаем отзыв
    review = await client.post(
        "/reviews",
        json={
            "job_id": job_data["id"],
            "to_user_id": worker["id"],
            "rating": 5,
            "comment": "Excellent work!",
        },
        headers=customer_headers,
    )

    print(review.status_code)
    print(review.json())

    assert review.status_code == 201

    review_data = review.json()

    assert review_data["job_id"] == job_data["id"]
    assert review_data["to_user_id"] == worker["id"]
    assert review_data["comment"] == "Excellent work!"

    # Получить все отзывы
    reviews = await client.get("/reviews")

    assert reviews.status_code == 200
    assert len(reviews.json()) >= 1

    # Получить отзыв по id
    response = await client.get(
        f"/reviews/{review_data['id']}"
    )

    assert response.status_code == 200
    assert response.json()["comment"] == "Excellent work!"

    # Получить отзывы пользователя
    user_reviews = await client.get(
        f"/reviews/user/{worker['id']}"
    )

    assert user_reviews.status_code == 200

    # Удалить отзыв
    deleted = await client.delete(
        f"/reviews/{review_data['id']}"
    )

    assert deleted.status_code == 204